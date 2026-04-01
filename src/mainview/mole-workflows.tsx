import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
	MOLE_WORKFLOWS,
	type MoleCommandResult,
	type MoleWorkflowDefinition,
	type MoleWorkflowMode,
} from "../shared/mole";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./components/ui/card";
import { monitoringBridge } from "./monitoring";

export function MoleWorkflowsPanel() {
	const [lastResult, setLastResult] = useState<MoleCommandResult | null>(null);
	const [history, setHistory] = useState<MoleCommandResult[]>([]);

	const statusQuery = useQuery({
		queryKey: ["mole-status"],
		queryFn: () => monitoringBridge.getMoleStatus(),
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const workflowMutation = useMutation({
		mutationFn: ({
			workflowId,
			mode,
		}: {
			workflowId: MoleWorkflowDefinition["id"];
			mode: MoleWorkflowMode;
		}) => monitoringBridge.runMoleWorkflow({ workflowId, mode }),
		onSuccess: (result) => {
			setLastResult(result);
			setHistory((previous) => [result, ...previous].slice(0, 4));
			void statusQuery.refetch();
		},
	});

	const availability = statusQuery.data?.availability;
	const isInstalled = availability?.isInstalled ?? false;

	return (
		<Card>
			<CardHeader className="gap-2 px-5 pb-3 pt-5 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1.5">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Wave 3 workflows</Badge>
						<Badge variant={isInstalled ? "success" : "warning"}>
							{isInstalled ? "Mole detected" : "Mole not detected"}
						</Badge>
						{statusQuery.data?.summary ? (
							<Badge
								variant={statusVariant(statusQuery.data.summary.healthScore)}
							>
								Health {formatHealth(statusQuery.data.summary.healthScore)}
							</Badge>
						) : null}
						{workflowMutation.isPending ? (
							<Badge variant="secondary">Command running…</Badge>
						) : null}
					</div>
					<div>
						<CardTitle>Mole-powered optimization workflows</CardTitle>
						<CardDescription>
							Preview Mole actions first when possible, then confirm before
							applying cleanup or optimization changes.
						</CardDescription>
					</div>
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={() => void statusQuery.refetch()}
					disabled={statusQuery.isFetching || workflowMutation.isPending}
				>
					{statusQuery.isFetching ? "Refreshing Mole…" : "Refresh Mole status"}
				</Button>
			</CardHeader>
			<CardContent className="space-y-4 px-5 pb-5">
				{statusQuery.isPending ? (
					<p className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-400">
						Checking whether the `mo` CLI is available…
					</p>
				) : null}

				{statusQuery.isError ? (
					<InlineMessage
						variant="destructive"
						message={`Unable to query Mole status: ${getErrorMessage(statusQuery.error)}`}
					/>
				) : null}

				{statusQuery.data && !statusQuery.data.availability.isInstalled ? (
					<div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3.5 text-sm leading-5 text-amber-100">
						<p className="font-medium">Mole is not installed on PATH.</p>
						<p className="mt-1.5">
							{statusQuery.data.availability.installHint}
						</p>
						<p className="mt-2.5 rounded-xl border border-amber-300/20 bg-slate-950/60 px-3 py-2 font-mono text-xs text-amber-50">
							{statusQuery.data.availability.installCommand}
						</p>
					</div>
				) : null}

				{statusQuery.data?.summary ? (
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
						<StatusStat
							label="Health"
							value={statusQuery.data.summary.healthLabel ?? "Unknown"}
						/>
						<StatusStat
							label="Uptime"
							value={statusQuery.data.summary.uptime ?? "Unknown"}
						/>
						<StatusStat
							label="Hardware"
							value={statusQuery.data.summary.model ?? "Unknown"}
						/>
						<StatusStat
							label="Memory / Disk"
							value={formatHardware(statusQuery.data.summary)}
						/>
					</div>
				) : null}

				{statusQuery.data?.error ? (
					<InlineMessage variant="warning" message={statusQuery.data.error} />
				) : null}

				<div className="grid gap-3 xl:grid-cols-2">
					{MOLE_WORKFLOWS.map((workflow) => (
						<WorkflowCard
							key={workflow.id}
							workflow={workflow}
							busy={workflowMutation.isPending}
							disabled={!isInstalled}
							running={workflowMutation.variables?.workflowId === workflow.id}
							onRun={(mode) => {
								if (
									mode === "apply" &&
									!window.confirm(workflow.confirmationMessage)
								) {
									return;
								}

								workflowMutation.mutate({ workflowId: workflow.id, mode });
							}}
						/>
					))}
				</div>

				{workflowMutation.error ? (
					<InlineMessage
						variant="destructive"
						message={`Unable to start the Mole command: ${getErrorMessage(workflowMutation.error)}`}
					/>
				) : null}

				{lastResult ? <CommandResultPanel result={lastResult} /> : null}

				{history.length > 1 ? (
					<div className="space-y-3">
						<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
							Recent command results
						</p>
						<div className="space-y-2">
							{history.slice(1).map((result) => (
								<div
									key={`${result.workflowId}-${result.mode}-${result.finishedAt}`}
									className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm"
								>
									<div>
										<p className="font-medium text-slate-100">
											{labelWorkflow(result.workflowId)} ·{" "}
											{labelMode(result.mode)}
										</p>
										<p className="text-slate-500">
											{formatTime(result.finishedAt)}
										</p>
									</div>
									<Badge variant={result.ok ? "success" : "destructive"}>
										{result.ok ? "completed" : "failed"}
									</Badge>
								</div>
							))}
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

function WorkflowCard({
	workflow,
	busy,
	disabled,
	running,
	onRun,
}: {
	workflow: MoleWorkflowDefinition;
	busy: boolean;
	disabled: boolean;
	running: boolean;
	onRun: (mode: MoleWorkflowMode) => void;
}) {
	return (
		<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1.5">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-base font-medium text-slate-50">
							{workflow.title}
						</p>
						<Badge variant="outline">{workflow.id}</Badge>
						{workflow.previewRecommended ? (
							<Badge variant="warning">Preview first</Badge>
						) : null}
					</div>
					<p className="text-sm leading-5 text-slate-400">
						{workflow.description}
					</p>
				</div>
				{running && busy ? <Badge variant="secondary">Running…</Badge> : null}
			</div>

			<div className="mt-3 flex flex-wrap gap-2">
				<Button
					size="sm"
					onClick={() => onRun("preview")}
					disabled={disabled || busy}
				>
					{workflow.previewLabel}
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="border-rose-400/30 text-rose-100 hover:bg-rose-400/10"
					onClick={() => onRun("apply")}
					disabled={disabled || busy}
				>
					{workflow.runLabel}
				</Button>
			</div>
		</div>
	);
}

function CommandResultPanel({ result }: { result: MoleCommandResult }) {
	return (
		<div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-base font-medium text-slate-50">
						Latest result · {labelWorkflow(result.workflowId)} ·{" "}
						{labelMode(result.mode)}
					</p>
					<p className="text-sm text-slate-500">
						{result.command.join(" ")} · finished{" "}
						{formatTime(result.finishedAt)}
					</p>
				</div>
				<Badge variant={result.ok ? "success" : "destructive"}>
					{result.ok ? "success" : "failed"}
				</Badge>
			</div>

			<div className="grid gap-2.5 sm:grid-cols-3">
				<StatusStat
					label="Exit code"
					value={result.exitCode === null ? "n/a" : String(result.exitCode)}
				/>
				<StatusStat
					label="Duration"
					value={`${(result.durationMs / 1000).toFixed(1)}s`}
				/>
				<StatusStat label="Completed" value={formatTime(result.finishedAt)} />
			</div>

			{result.error ? (
				<InlineMessage variant="destructive" message={result.error} />
			) : null}

			<div className="space-y-2">
				<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
					Command output
				</p>
				<pre className="max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs leading-5 text-slate-200 whitespace-pre-wrap wrap-break-word">
					{result.combinedOutput || "No command output was captured."}
				</pre>
			</div>
		</div>
	);
}

function InlineMessage({
	variant,
	message,
}: {
	variant: "warning" | "destructive";
	message: string;
}) {
	return (
		<p
			className={
				variant === "warning"
					? "rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm leading-5 text-amber-100"
					: "rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm leading-5 text-rose-100"
			}
		>
			{message}
		</p>
	);
}

function StatusStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
			<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
				{label}
			</p>
			<p className="mt-1.5 text-base font-medium text-slate-100">{value}</p>
		</div>
	);
}

function formatHardware(summary: {
	totalRam: string | null;
	diskSize: string | null;
}) {
	const parts = [summary.totalRam, summary.diskSize].filter(Boolean);
	return parts.length > 0 ? parts.join(" · ") : "Unknown";
}

function statusVariant(score: number | null) {
	if (score === null) {
		return "secondary";
	}

	if (score >= 85) {
		return "success";
	}

	if (score >= 60) {
		return "warning";
	}

	return "destructive";
}

function formatHealth(score: number | null) {
	return score === null ? "n/a" : `${Math.round(score)}`;
}

function labelWorkflow(workflowId: MoleCommandResult["workflowId"]) {
	return (
		MOLE_WORKFLOWS.find((workflow) => workflow.id === workflowId)?.title ??
		workflowId
	);
}

function labelMode(mode: MoleWorkflowMode) {
	return mode === "preview" ? "preview" : "apply";
}

function formatTime(value: string) {
	return new Date(value).toLocaleTimeString();
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Unknown Mole bridge error.";
}
