import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { DashboardSkeleton } from "./components/skeletons/dashboard-skeleton";
import {
	CollectorHealthPanel,
	CpuPanel,
	DiskPanel,
	MemoryPanel,
	NetworkPanel,
	ProcessesPanel,
	SummaryMetricCard,
	buildSummaryCards,
} from "./components/panels";
import { PanelErrorBoundary } from "./components/panels/panel-error-boundary";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { getErrorMessage } from "./lib/errors";
import { formatTime } from "./lib/format";
import { MoleWorkflowsPanel } from "./mole-workflows";
import { monitoringBridge } from "./monitoring";
import {
	PROCESS_LIMIT_OPTIONS,
	REFRESH_INTERVAL_OPTIONS,
	useDashboardStore,
	useHydrateSettings,
} from "./store/dashboard-store";

export function Dashboard() {
	const processLimit = useDashboardStore((state) => state.processLimit);
	const refreshIntervalMs = useDashboardStore((state) => state.refreshIntervalMs);
	const liveUpdatesEnabled = useDashboardStore((state) => state.liveUpdatesEnabled);
	const setProcessLimit = useDashboardStore((state) => state.setProcessLimit);
	const setRefreshIntervalMs = useDashboardStore((state) => state.setRefreshIntervalMs);
	const toggleLiveUpdates = useDashboardStore((state) => state.toggleLiveUpdates);
	useHydrateSettings();
	const query = useQuery({
		queryKey: ["monitoring-snapshot", processLimit],
		queryFn: () => monitoringBridge.getMonitoringSnapshot({ processLimit }),
		placeholderData: (previous) => previous,
		refetchInterval: liveUpdatesEnabled ? refreshIntervalMs : false,
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
	const snapshot = query.data;
	const hasBlockingError = !snapshot && query.isError;

	return (
		<main className="min-h-screen">
			<div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
				<Card>
					<CardHeader className="gap-4 px-5 pb-5 pt-5 lg:flex-row lg:items-start lg:justify-between">
						<div className="space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="success">Wave 2 dashboard</Badge>
								<Badge variant={liveUpdatesEnabled ? "secondary" : "warning"}>{liveUpdatesEnabled ? "Live updates on" : "Live updates paused"}</Badge>
								{snapshot ? <Badge variant="outline">Last updated {formatTime(snapshot.collectedAt)}</Badge> : null}
								{query.isFetching ? <Badge variant="secondary">Refreshing…</Badge> : null}
								{query.isError && snapshot ? <Badge variant="warning">Showing cached sample</Badge> : null}
							</div>
							<div className="space-y-2">
								<h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">macOS System Optimizer</h1>
								<p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-base">A real-time desktop dashboard for CPU, memory, disk, process, and network health, now composed from focused panel modules and shared UI primitives.</p>
							</div>
						</div>
						<div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 sm:p-4">
							<div className="flex flex-wrap gap-2">
								<Button size="sm" variant={liveUpdatesEnabled ? "outline" : "default"} onClick={toggleLiveUpdates}>{liveUpdatesEnabled ? "Pause live updates" : "Resume live updates"}</Button>
								<Button size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>Refresh now</Button>
							</div>
							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								<ControlGroup label="Refresh cadence">
									{REFRESH_INTERVAL_OPTIONS.map((intervalMs) => (
										<Button key={intervalMs} size="sm" variant={intervalMs === refreshIntervalMs ? "default" : "outline"} onClick={() => setRefreshIntervalMs(intervalMs)}>{Math.round(intervalMs / 1000)}s</Button>
									))}
								</ControlGroup>
								<ControlGroup label="Process rows">
									{PROCESS_LIMIT_OPTIONS.map((limit) => (
										<Button key={limit} size="sm" variant={limit === processLimit ? "default" : "outline"} onClick={() => setProcessLimit(limit)}>{limit}</Button>
									))}
								</ControlGroup>
							</div>
						</div>
					</CardHeader>
				</Card>
				{hasBlockingError ? <QueryErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
				{!snapshot && query.isPending ? <DashboardSkeleton /> : null}
				{snapshot ? (
					<>
						<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{buildSummaryCards(snapshot).map((card) => <SummaryMetricCard key={card.title} card={card} />)}</section>
						<Tabs defaultValue="overview" className="space-y-4">
							<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
								<div className="space-y-1">
									<h2 className="text-lg font-semibold tracking-tight text-slate-50">Dashboard sections</h2>
									<p className="max-w-2xl text-sm text-slate-400">Switch between the live system overview, process activity, and Mole optimization workflows.</p>
								</div>
								<TabsList className="p-1.5">
									<TabsTrigger className="min-w-24 px-3.5 py-1.5" value="overview">Overview</TabsTrigger>
									<TabsTrigger className="min-w-24 px-3.5 py-1.5" value="processes">Processes</TabsTrigger>
									<TabsTrigger className="min-w-24 px-3.5 py-1.5" value="optimize">Optimize</TabsTrigger>
								</TabsList>
							</div>
							<TabsContent value="overview" className="space-y-4">
								<section className="grid gap-4 xl:grid-cols-2">
									<PanelErrorBoundary panelName="CPU"><CpuPanel metric={snapshot.cpu} /></PanelErrorBoundary>
									<PanelErrorBoundary panelName="Memory"><MemoryPanel metric={snapshot.memory} /></PanelErrorBoundary>
									<PanelErrorBoundary panelName="Disk"><DiskPanel metric={snapshot.disk} /></PanelErrorBoundary>
									<PanelErrorBoundary panelName="Network"><NetworkPanel metric={snapshot.network} /></PanelErrorBoundary>
								</section>
								<PanelErrorBoundary panelName="Collector health"><CollectorHealthPanel queryError={query.isError ? getErrorMessage(query.error) : null} snapshot={snapshot} /></PanelErrorBoundary>
							</TabsContent>
							<TabsContent value="processes"><PanelErrorBoundary panelName="Processes"><ProcessesPanel metric={snapshot.processes} processLimit={processLimit} /></PanelErrorBoundary></TabsContent>
							<TabsContent value="optimize"><PanelErrorBoundary panelName="Mole workflows"><MoleWorkflowsPanel /></PanelErrorBoundary></TabsContent>
						</Tabs>
					</>
				) : null}
			</div>
		</main>
	);
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{label}</p>
			<div className="flex flex-wrap gap-2">{children}</div>
		</div>
	);
}

function QueryErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<Card className="border-rose-400/30 bg-rose-400/10">
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>Unable to reach the monitoring bridge</CardTitle>
				<CardDescription className="text-rose-100/80">{message}</CardDescription>
			</CardHeader>
			<CardContent className="px-5 pb-5"><Button variant="outline" onClick={onRetry}>Try again</Button></CardContent>
		</Card>
	);
}