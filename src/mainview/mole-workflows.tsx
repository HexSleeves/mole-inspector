import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { MOLE_WORKFLOWS, type MoleCommandResult, type MoleWorkflowDefinition, type MoleWorkflowId, type MoleWorkflowMode } from "../shared/mole";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";
import { InlineMessage } from "./components/ui/inline-message";
import { CompactMetricStat } from "./components/ui/metric-stat";
import { getErrorMessage } from "./lib/errors";
import { formatTime } from "./lib/format";
import { useWorkflowToast } from "./lib/use-workflow-toast";
import { monitoringBridge } from "./monitoring";

type ActiveMoleExecution = {
	workflowId: MoleWorkflowId;
	mode: MoleWorkflowMode;
	status: "queued" | "running";
	queuedAt: string;
};

export function MoleWorkflowsPanel() {
	const [lastResult, setLastResult] = useState<MoleCommandResult | null>(null);
	const [activeExecution, setActiveExecution] = useState<ActiveMoleExecution | null>(null);
	const queryClient = useQueryClient();
	useWorkflowToast(lastResult);
	const statusQuery = useQuery({
		queryKey: ["mole-status"],
		queryFn: () => monitoringBridge.getMoleStatus(),
		refetchOnWindowFocus: false,
		retry: 1,
	});
	const historyQuery = useQuery({
		queryKey: ["workflow-history"],
		queryFn: () => monitoringBridge.getWorkflowHistory({ limit: 5 }),
		refetchOnWindowFocus: false,
		retry: 1,
	});
	const workflowMutation = useMutation({
		mutationFn: async ({ workflowId, mode, queuedAt }: { workflowId: MoleWorkflowDefinition["id"]; mode: MoleWorkflowMode; queuedAt: string }) => {
			setActiveExecution({ workflowId, mode, status: "running", queuedAt });
			return monitoringBridge.runMoleWorkflow({ workflowId, mode });
		},
		onSuccess: (result) => {
			setActiveExecution(null);
			setLastResult(result);
			void queryClient.invalidateQueries({ queryKey: ["workflow-history"] });
			void statusQuery.refetch();
		},
		onError: () => setActiveExecution(null),
	});
	const history = historyQuery.data ?? [];
	const olderResults = lastResult
		? history.filter(
			(result) =>
				result.startedAt !== lastResult.startedAt ||
				result.workflowId !== lastResult.workflowId,
		)
		: history;
	const availability = statusQuery.data?.availability;
	const isInstalled = availability?.isInstalled ?? false;
	const workflowIsBusy = activeExecution !== null || workflowMutation.isPending;
	const queueWorkflow = (workflowId: MoleWorkflowDefinition["id"], mode: MoleWorkflowMode) => {
		workflowMutation.reset();
		const queuedExecution: ActiveMoleExecution = { workflowId, mode, status: "queued", queuedAt: new Date().toISOString() };
		setActiveExecution(queuedExecution);
		window.setTimeout(() => workflowMutation.mutate(queuedExecution), 0);
	};

	return (
		<Card>
			<CardHeader className="gap-2 px-5 pb-3 pt-5 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1.5">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Wave 3 workflows</Badge>
						<Badge variant={isInstalled ? "success" : "warning"}>{isInstalled ? "Mole detected" : "Mole not detected"}</Badge>
						{statusQuery.data?.summary ? <Badge variant={statusVariant(statusQuery.data.summary.healthScore)}>Health {formatHealth(statusQuery.data.summary.healthScore)}</Badge> : null}
						{activeExecution ? <Badge variant="secondary">{activeExecution.status === "queued" ? "Command queued…" : "Command running…"}</Badge> : null}
					</div>
					<div>
						<CardTitle>Mole-powered optimization workflows</CardTitle>
						<CardDescription>Preview Mole actions first when possible, then confirm before applying cleanup or optimization changes.</CardDescription>
					</div>
				</div>
				<Button size="sm" variant="outline" onClick={() => void statusQuery.refetch()} disabled={statusQuery.isFetching || workflowIsBusy}>{statusQuery.isFetching ? "Refreshing Mole…" : "Refresh Mole status"}</Button>
			</CardHeader>
			<CardContent className="space-y-4 px-5 pb-5">
				{statusQuery.isPending ? <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-400">Checking whether the `mo` CLI is available…</p> : null}
				{statusQuery.isError ? <InlineMessage variant="error">Unable to query Mole status: {getErrorMessage(statusQuery.error)}</InlineMessage> : null}
				{statusQuery.data && !statusQuery.data.availability.isInstalled ? (
					<div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3.5 text-sm leading-5 text-amber-100">
						<p className="font-medium">Mole is not installed on PATH.</p>
						<p className="mt-1.5">{statusQuery.data.availability.installHint}</p>
						<p className="mt-2.5 rounded-xl border border-amber-300/20 bg-slate-950/60 px-3 py-2 font-mono text-xs text-amber-50">{statusQuery.data.availability.installCommand}</p>
					</div>
				) : null}
				{statusQuery.data?.summary ? (
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
						<CompactMetricStat label="Health" value={statusQuery.data.summary.healthLabel ?? "Unknown"} />
						<CompactMetricStat label="Uptime" value={statusQuery.data.summary.uptime ?? "Unknown"} />
						<CompactMetricStat label="Hardware" value={statusQuery.data.summary.model ?? "Unknown"} />
						<CompactMetricStat label="Memory / Disk" value={formatHardware(statusQuery.data.summary)} />
					</div>
				) : null}
				{statusQuery.data?.error ? <InlineMessage variant="warning">{statusQuery.data.error}</InlineMessage> : null}
				<div className="grid gap-3 xl:grid-cols-2">
					{MOLE_WORKFLOWS.map((workflow) => (
						<WorkflowCard
							key={workflow.id}
							workflow={workflow}
							busy={workflowIsBusy}
							disabled={!isInstalled}
							status={activeExecution?.workflowId === workflow.id ? activeExecution.status : null}
							onRun={(mode) => {
								if (mode === "apply" && !window.confirm(workflow.confirmationMessage)) return;
								queueWorkflow(workflow.id, mode);
							}}
						/>
					))}
				</div>
				{workflowMutation.error ? <InlineMessage variant="error">Unable to start the Mole command: {getErrorMessage(workflowMutation.error)}</InlineMessage> : null}
				{activeExecution ? <ExecutionStatusPanel execution={activeExecution} /> : null}
				{lastResult ? <CommandResultPanel result={lastResult} /> : null}
					{olderResults.length > 0 ? (
					<Collapsible defaultOpen={false} className="space-y-3">
						<CollapsibleTrigger>Recent command results</CollapsibleTrigger>
						<CollapsibleContent className="border-0 bg-transparent">
							<div className="space-y-2">
									{olderResults.map((result) => (
									<div key={`${result.workflowId}-${result.mode}-${result.finishedAt}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
										<div>
											<p className="font-medium text-slate-100">{labelWorkflow(result.workflowId)} · {labelMode(result.mode)}</p>
											<p className="text-slate-500">{formatTime(result.finishedAt)}</p>
										</div>
										<Badge variant={result.ok ? "success" : "destructive"}>{result.ok ? "completed" : "failed"}</Badge>
									</div>
								))}
							</div>
						</CollapsibleContent>
					</Collapsible>
				) : null}
			</CardContent>
		</Card>
	);
}

function WorkflowCard({ workflow, busy, disabled, status, onRun }: { workflow: MoleWorkflowDefinition; busy: boolean; disabled: boolean; status: ActiveMoleExecution["status"] | null; onRun: (mode: MoleWorkflowMode) => void }) {
	return (
		<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1.5">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-base font-medium text-slate-50">{workflow.title}</p>
						<Badge variant="outline">{workflow.id}</Badge>
						{workflow.previewRecommended ? <Badge variant="warning">Preview first</Badge> : null}
					</div>
					<p className="text-sm leading-5 text-slate-400">{workflow.description}</p>
				</div>
				{status ? <Badge variant="secondary">{status === "queued" ? "Queued…" : "Running…"}</Badge> : null}
			</div>
			<div className="mt-3 flex flex-wrap gap-2">
				<Button size="sm" onClick={() => onRun("preview")} disabled={disabled || busy}>{workflow.previewLabel}</Button>
				<Button size="sm" variant="outline" className="border-rose-400/30 text-rose-100 hover:bg-rose-400/10" onClick={() => onRun("apply")} disabled={disabled || busy}>{workflow.runLabel}</Button>
			</div>
		</div>
	);
}

export function ExecutionStatusPanel({ execution }: { execution: ActiveMoleExecution }) {
	const command = formatWorkflowCommand(execution.workflowId, execution.mode);
	return (
		<div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-base font-medium text-slate-50">Current execution · {labelWorkflow(execution.workflowId)} · {labelMode(execution.mode)}</p>
					<p className="text-sm text-slate-500">{command}</p>
				</div>
				<Badge variant="secondary">{execution.status === "queued" ? "Queued" : "Running"}</Badge>
			</div>
			<InlineMessage variant="success">{execution.status === "queued" ? `Queued ${labelMode(execution.mode)} command. Starting ${command} now.` : `Running ${command}. Mole may finish without terminal output for some apply commands.`}</InlineMessage>
		</div>
	);
}

export function CommandResultPanel({ result }: { result: MoleCommandResult }) {
	return (
		<div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-base font-medium text-slate-50">Latest result · {labelWorkflow(result.workflowId)} · {labelMode(result.mode)}</p>
					<p className="text-sm text-slate-500">{result.command.join(" ")} · finished {formatTime(result.finishedAt)}</p>
				</div>
				<Badge variant={result.ok ? "success" : "destructive"}>{result.ok ? "completed" : "failed"}</Badge>
			</div>
			<div className="grid gap-2.5 sm:grid-cols-3">
				<CompactMetricStat label="Exit code" value={result.exitCode === null ? "n/a" : String(result.exitCode)} />
				<CompactMetricStat label="Duration" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
				<CompactMetricStat label="Completed" value={formatTime(result.finishedAt)} />
			</div>
			{result.error ? <InlineMessage variant="error">{result.error}</InlineMessage> : null}
			{result.ok && result.outputState === "empty" ? <InlineMessage variant="success">Command completed successfully and did not emit stdout or stderr for this run.</InlineMessage> : null}
			<div className="space-y-2">
				<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Terminal output</p>
				<pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs leading-5 text-slate-200">{result.combinedOutput || "No terminal output for this run."}</pre>
			</div>
		</div>
	);
}

function formatHardware(summary: { totalRam: string | null; diskSize: string | null }) {
	const parts = [summary.totalRam, summary.diskSize].filter(Boolean);
	return parts.length > 0 ? parts.join(" · ") : "Unknown";
}

function statusVariant(score: number | null) {
	if (score === null) return "secondary";
	if (score >= 85) return "success";
	if (score >= 60) return "warning";
	return "destructive";
}

function formatHealth(score: number | null) {
	return score === null ? "n/a" : `${Math.round(score)}`;
}

function labelWorkflow(workflowId: MoleCommandResult["workflowId"]) {
	return MOLE_WORKFLOWS.find((workflow) => workflow.id === workflowId)?.title ?? workflowId;
}

function labelMode(mode: MoleWorkflowMode) {
	return mode === "preview" ? "preview" : "apply";
}

function formatWorkflowCommand(workflowId: MoleWorkflowId, mode: MoleWorkflowMode) {
	const workflow = MOLE_WORKFLOWS.find((candidate) => candidate.id === workflowId);
	if (!workflow) return `mo ${workflowId}`;
	return ["mo", ...(mode === "preview" ? workflow.previewArgs : workflow.runArgs)].join(" ");
}