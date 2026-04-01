import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
	isMetricOk,
	type MetricResult,
	type MonitoringSnapshot,
	type NetworkInterfaceSnapshot,
	type NetworkSnapshot,
	type ProcessSnapshot,
} from "../shared/monitoring";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./components/ui/card";
import { Progress } from "./components/ui/progress";
import { ScrollArea } from "./components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./components/ui/table";
import { MoleWorkflowsPanel } from "./mole-workflows";
import { monitoringBridge } from "./monitoring";
import {
	PROCESS_LIMIT_OPTIONS,
	REFRESH_INTERVAL_OPTIONS,
	useDashboardStore,
} from "./store/dashboard-store";

type SummaryCard = {
	title: string;
	value: string;
	detail: string;
	variant: "success" | "warning" | "destructive" | "secondary";
};

export function Dashboard() {
	const processLimit = useDashboardStore((state) => state.processLimit);
	const refreshIntervalMs = useDashboardStore(
		(state) => state.refreshIntervalMs,
	);
	const liveUpdatesEnabled = useDashboardStore(
		(state) => state.liveUpdatesEnabled,
	);
	const setProcessLimit = useDashboardStore((state) => state.setProcessLimit);
	const setRefreshIntervalMs = useDashboardStore(
		(state) => state.setRefreshIntervalMs,
	);
	const toggleLiveUpdates = useDashboardStore(
		(state) => state.toggleLiveUpdates,
	);

	const query = useQuery({
		queryKey: ["monitoring-snapshot", processLimit],
		queryFn: () =>
			monitoringBridge.getMonitoringSnapshot({
				processLimit,
			}),
		placeholderData: (previous) => previous,
		refetchInterval: liveUpdatesEnabled ? refreshIntervalMs : false,
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const snapshot = query.data;
	const summaryCards = snapshot ? buildSummaryCards(snapshot) : [];
	const hasBlockingError = !snapshot && query.isError;

	return (
		<main className="min-h-screen">
			<div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
				<Card>
					<CardHeader className="gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="space-y-4">
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="success">Wave 2 dashboard</Badge>
								<Badge variant={liveUpdatesEnabled ? "secondary" : "warning"}>
									{liveUpdatesEnabled
										? "Live updates on"
										: "Live updates paused"}
								</Badge>
								{snapshot ? (
									<Badge variant="outline">
										Last updated {formatTime(snapshot.collectedAt)}
									</Badge>
								) : null}
								{query.isFetching ? (
									<Badge variant="secondary">Refreshing…</Badge>
								) : null}
								{query.isError && snapshot ? (
									<Badge variant="warning">Showing cached sample</Badge>
								) : null}
							</div>
							<div className="space-y-2">
								<h1 className="text-4xl font-semibold tracking-tight text-white">
									macOS System Optimizer
								</h1>
								<p className="max-w-3xl text-base leading-7 text-slate-300">
									A real-time desktop dashboard for CPU, memory, disk, process,
									and network health. The renderer now uses Tailwind CSS v4,
									Zustand, TanStack Query, and shadcn-style UI primitives.
								</p>
							</div>
						</div>
						<div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
							<div className="flex flex-wrap gap-2">
								<Button
									size="sm"
									variant={liveUpdatesEnabled ? "outline" : "default"}
									onClick={toggleLiveUpdates}
								>
									{liveUpdatesEnabled
										? "Pause live updates"
										: "Resume live updates"}
								</Button>
								<Button
									size="sm"
									variant="default"
									onClick={() => void query.refetch()}
									disabled={query.isFetching}
								>
									Refresh now
								</Button>
							</div>
							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								<ControlGroup label="Refresh cadence">
									{REFRESH_INTERVAL_OPTIONS.map((intervalMs) => (
										<Button
											key={intervalMs}
											size="sm"
											variant={
												intervalMs === refreshIntervalMs ? "default" : "outline"
											}
											onClick={() => setRefreshIntervalMs(intervalMs)}
										>
											{Math.round(intervalMs / 1000)}s
										</Button>
									))}
								</ControlGroup>
								<ControlGroup label="Process rows">
									{PROCESS_LIMIT_OPTIONS.map((limit) => (
										<Button
											key={limit}
											size="sm"
											variant={limit === processLimit ? "default" : "outline"}
											onClick={() => setProcessLimit(limit)}
										>
											{limit}
										</Button>
									))}
								</ControlGroup>
							</div>
						</div>
					</CardHeader>
				</Card>

				{hasBlockingError ? (
					<QueryErrorState
						message={getErrorMessage(query.error)}
						onRetry={() => void query.refetch()}
					/>
				) : null}

				{!snapshot && query.isPending ? <LoadingState /> : null}

				{snapshot ? (
					<>
						<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
							{summaryCards.map((card) => (
								<SummaryMetricCard key={card.title} card={card} />
							))}
						</section>

						<section className="grid gap-6 xl:grid-cols-2">
							<CpuPanel metric={snapshot.cpu} />
							<MemoryPanel metric={snapshot.memory} />
							<DiskPanel metric={snapshot.disk} />
							<NetworkPanel metric={snapshot.network} />
						</section>

						<ProcessesPanel
							metric={snapshot.processes}
							processLimit={processLimit}
						/>

						<CollectorHealthPanel
							snapshot={snapshot}
							queryError={query.isError ? getErrorMessage(query.error) : null}
						/>

						<MoleWorkflowsPanel />
					</>
				) : null}
			</div>
		</main>
	);
}

function SummaryMetricCard({ card }: { card: SummaryCard }) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-3">
					<CardTitle className="text-base">{card.title}</CardTitle>
					<Badge variant={card.variant}>{card.variant}</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				<p className="text-3xl font-semibold text-slate-50">{card.value}</p>
				<p className="text-sm text-slate-400">{card.detail}</p>
			</CardContent>
		</Card>
	);
}

function CpuPanel({ metric }: { metric: MonitoringSnapshot["cpu"] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>CPU load</CardTitle>
				<CardDescription>
					Overall load, user/system split, and per-core activity.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!isMetricOk(metric) ? (
					<MetricUnavailable message={metric.message} />
				) : (
					<div className="space-y-5">
						<div className="grid gap-4 sm:grid-cols-3">
							<MetricStat
								label="Overall load"
								value={formatPercent(metric.data.overallLoadPercent)}
							/>
							<MetricStat
								label="User load"
								value={formatPercent(metric.data.userLoadPercent)}
							/>
							<MetricStat
								label="System load"
								value={formatPercent(metric.data.systemLoadPercent)}
							/>
						</div>
						<Progress value={metric.data.overallLoadPercent} />
						<div className="grid gap-3 sm:grid-cols-2">
							{metric.data.perCoreLoadPercent.map((coreLoad, index) => (
								<div
									key={coreLoad}
									className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
								>
									<div className="flex items-center justify-between text-sm text-slate-300">
										<span>Core {index + 1}</span>
										<span>{formatPercent(coreLoad)}</span>
									</div>
									<Progress value={coreLoad} />
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function MemoryPanel({ metric }: { metric: MonitoringSnapshot["memory"] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Memory pressure</CardTitle>
				<CardDescription>
					Live RAM usage, excluding reclaimable macOS cache, with swap and
					available headroom.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!isMetricOk(metric) ? (
					<MetricUnavailable message={metric.message} />
				) : (
					<div className="space-y-5">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm text-slate-300">
								<span>RAM in use</span>
								<span>{formatPercent(metric.data.utilizationPercent)}</span>
							</div>
							<Progress value={metric.data.utilizationPercent} />
							<p className="text-sm text-slate-400">
								{formatBytes(metric.data.usedBytes)} used of{" "}
								{formatBytes(metric.data.totalBytes)} total ·{" "}
								{formatBytes(metric.data.availableBytes)} available
							</p>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm text-slate-300">
								<span>Swap in use</span>
								<span>{formatPercent(metric.data.swapUtilizationPercent)}</span>
							</div>
							<Progress
								value={metric.data.swapUtilizationPercent}
								className="**:data-slot:bg-amber-400"
							/>
							<p className="text-sm text-slate-400">
								{formatBytes(metric.data.swapUsedBytes)} used of{" "}
								{formatBytes(metric.data.swapTotalBytes)} total · active memory{" "}
								{formatBytes(metric.data.activeBytes)}
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function DiskPanel({ metric }: { metric: MonitoringSnapshot["disk"] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Disk capacity and I/O</CardTitle>
				<CardDescription>
					Mounted volumes and live read/write operations when available.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!isMetricOk(metric) ? (
					<MetricUnavailable message={metric.message} />
				) : metric.data.volumes.length === 0 ? (
					<EmptyState message="No mounted volumes were reported by the collector." />
				) : (
					<div className="space-y-5">
						<div className="grid gap-4 sm:grid-cols-3">
							<MetricStat
								label="Read ops/sec"
								value={formatOps(metric.data.io.readOpsPerSecond)}
							/>
							<MetricStat
								label="Write ops/sec"
								value={formatOps(metric.data.io.writeOpsPerSecond)}
							/>
							<MetricStat
								label="Total ops/sec"
								value={formatOps(metric.data.io.totalOpsPerSecond)}
							/>
						</div>
						<div className="space-y-3">
							{metric.data.volumes.slice(0, 4).map((volume) => (
								<div
									key={`${volume.mount}-${volume.name}`}
									className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
								>
									<div className="flex items-center justify-between gap-3 text-sm text-slate-300">
										<div>
											<p className="font-medium text-slate-100">
												{volume.mount || volume.name}
											</p>
											<p className="text-xs text-slate-500">{volume.type}</p>
										</div>
										<Badge
											variant={volume.isReadWrite ? "secondary" : "warning"}
										>
											{volume.isReadWrite ? "read/write" : "read only"}
										</Badge>
									</div>
									<Progress value={volume.utilizationPercent} />
									<p className="text-sm text-slate-400">
										{formatBytes(volume.usedBytes)} used of{" "}
										{formatBytes(volume.sizeBytes)} ·{" "}
										{formatBytes(volume.availableBytes)} free
									</p>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function NetworkPanel({ metric }: { metric: MonitoringSnapshot["network"] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Network activity</CardTitle>
				<CardDescription>
					Interface identity plus live throughput when the macOS collector
					exposes stable samples.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!isMetricOk(metric) ? (
					<MetricUnavailable message={metric.message} />
				) : (
					<NetworkContent data={metric.data} />
				)}
			</CardContent>
		</Card>
	);
}

function NetworkContent({ data }: { data: NetworkSnapshot }) {
	if (data.interfaces.length === 0) {
		return (
			<EmptyState message="No network interfaces were reported on this machine." />
		);
	}

	const defaultInterface =
		data.interfaces.find((networkInterface) => networkInterface.isDefault) ??
		data.interfaces[0];
	const hasLiveRates = data.interfaces.some(
		(networkInterface) =>
			networkInterface.receivedBytesPerSecond !== null ||
			networkInterface.transmittedBytesPerSecond !== null,
	);

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-base font-medium text-slate-100">
							{defaultInterface.displayName || defaultInterface.name}
						</p>
						<p className="text-sm text-slate-400">
							IPv4 {defaultInterface.ipv4 || "n/a"} · IPv6{" "}
							{defaultInterface.ipv6 || "n/a"}
						</p>
					</div>
					<Badge variant={hasLiveRates ? "success" : "warning"}>
						{hasLiveRates ? "stable sample" : "warming up"}
					</Badge>
				</div>
				<div className="mt-4 grid gap-4 sm:grid-cols-2">
					<MetricStat
						label="Download"
						value={formatRate(defaultInterface.receivedBytesPerSecond)}
					/>
					<MetricStat
						label="Upload"
						value={formatRate(defaultInterface.transmittedBytesPerSecond)}
					/>
				</div>
			</div>

			{!hasLiveRates ? (
				<p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
					The current macOS collector can identify interfaces immediately, but
					byte-per-second throughput may need an additional sample before it
					stabilizes.
				</p>
			) : null}

			<div className="space-y-2">
				{data.interfaces.slice(0, 4).map((networkInterface) => (
					<div
						key={networkInterface.name}
						className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm"
					>
						<div>
							<p className="font-medium text-slate-100">
								{networkInterface.displayName || networkInterface.name}
							</p>
							<p className="text-slate-400">
								{networkInterface.state || "unknown"}
							</p>
						</div>
						<p className="text-slate-300">
							↓ {formatRate(networkInterface.receivedBytesPerSecond)} · ↑{" "}
							{formatRate(networkInterface.transmittedBytesPerSecond)}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

function ProcessesPanel({
	metric,
	processLimit,
}: {
	metric: MonitoringSnapshot["processes"];
	processLimit: number;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Process activity</CardTitle>
				<CardDescription>
					Top processes by CPU, including PID, memory usage, and owner.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!isMetricOk(metric) ? (
					<MetricUnavailable message={metric.message} />
				) : metric.data.list.length === 0 ? (
					<EmptyState message="The collector did not return any running processes." />
				) : (
					<div className="space-y-4">
						<div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
							<p>
								Showing the top {metric.data.list.length} of {metric.data.total}{" "}
								processes.
							</p>
							<Badge variant="secondary">limit {processLimit}</Badge>
						</div>
						<ScrollArea className="h-104 rounded-xl border border-slate-800">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>PID</TableHead>
										<TableHead>Process</TableHead>
										<TableHead>CPU</TableHead>
										<TableHead>Memory</TableHead>
										<TableHead>User</TableHead>
										<TableHead>State</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{metric.data.list.map((process) => (
										<ProcessRow
											key={`${process.pid}-${process.name}`}
											process={process}
										/>
									))}
								</TableBody>
							</Table>
						</ScrollArea>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function ProcessRow({ process }: { process: ProcessSnapshot }) {
	return (
		<TableRow>
			<TableCell className="font-mono text-xs text-slate-300">
				{process.pid}
			</TableCell>
			<TableCell>
				<div>
					<p className="font-medium text-slate-100">{process.name}</p>
					<p className="text-xs text-slate-500">ppid {process.parentPid}</p>
				</div>
			</TableCell>
			<TableCell>{formatPercent(process.cpuPercent)}</TableCell>
			<TableCell>
				<div>
					<p>{formatBytes(process.memoryBytes)}</p>
					<p className="text-xs text-slate-500">
						{formatPercent(process.memoryPercent)} of RAM
					</p>
				</div>
			</TableCell>
			<TableCell>{process.user || "system"}</TableCell>
			<TableCell>{process.state || "unknown"}</TableCell>
		</TableRow>
	);
}

function CollectorHealthPanel({
	snapshot,
	queryError,
}: {
	snapshot: MonitoringSnapshot;
	queryError: string | null;
}) {
	const metricRows: Array<{ label: string; metric: MetricResult<unknown> }> = [
		{ label: "CPU", metric: snapshot.cpu },
		{ label: "Memory", metric: snapshot.memory },
		{ label: "Disk", metric: snapshot.disk },
		{ label: "Processes", metric: snapshot.processes },
		{ label: "Network", metric: snapshot.network },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Collector health</CardTitle>
				<CardDescription>
					Each panel stays resilient to partial collector failures instead of
					crashing the renderer.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{metricRows.map(({ label, metric }) => (
					<div
						key={label}
						className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm"
					>
						<div>
							<p className="font-medium text-slate-100">{label}</p>
							<p className="text-slate-500">
								{isMetricOk(metric) ? "Collector healthy" : metric.message}
							</p>
						</div>
						<Badge variant={isMetricOk(metric) ? "success" : "destructive"}>
							{isMetricOk(metric) ? "ok" : "error"}
						</Badge>
					</div>
				))}

				{queryError ? (
					<p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
						The last live refresh failed, so the dashboard is still showing the
						previous sample: {queryError}
					</p>
				) : null}
			</CardContent>
		</Card>
	);
}

function ControlGroup({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
				{label}
			</p>
			<div className="flex flex-wrap gap-2">{children}</div>
		</div>
	);
}

function QueryErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<Card className="border-rose-400/30 bg-rose-400/10">
			<CardHeader>
				<CardTitle>Unable to reach the monitoring bridge</CardTitle>
				<CardDescription className="text-rose-100/80">
					{message}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" onClick={onRetry}>
					Try again
				</Button>
			</CardContent>
		</Card>
	);
}

const LOADING_SUMMARY_CARD_KEYS = [
	"loading-summary-cpu",
	"loading-summary-memory",
	"loading-summary-disk",
	"loading-summary-network",
	"loading-summary-processes",
] as const;

const LOADING_PANEL_KEYS = [
	"loading-panel-cpu",
	"loading-panel-memory",
	"loading-panel-disk",
	"loading-panel-network",
] as const;

function LoadingState() {
	return (
		<>
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				{LOADING_SUMMARY_CARD_KEYS.map((key) => (
					<Card key={key}>
						<CardContent className="space-y-3 p-6 animate-pulse">
							<div className="h-4 w-24 rounded bg-slate-800" />
							<div className="h-8 w-32 rounded bg-slate-800" />
							<div className="h-4 w-full rounded bg-slate-900" />
						</CardContent>
					</Card>
				))}
			</section>
			<section className="grid gap-6 xl:grid-cols-2">
				{LOADING_PANEL_KEYS.map((key) => (
					<Card key={key}>
						<CardContent className="space-y-3 p-6 animate-pulse">
							<div className="h-5 w-40 rounded bg-slate-800" />
							<div className="h-4 w-64 rounded bg-slate-900" />
							<div className="h-24 rounded-xl bg-slate-900" />
						</CardContent>
					</Card>
				))}
			</section>
		</>
	);
}

function MetricUnavailable({ message }: { message: string }) {
	return (
		<p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
			{message}
		</p>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<p className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
			{message}
		</p>
	);
}

function MetricStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
			<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
				{label}
			</p>
			<p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
		</div>
	);
}

function buildSummaryCards(snapshot: MonitoringSnapshot): SummaryCard[] {
	const cards: SummaryCard[] = [];

	if (isMetricOk(snapshot.cpu)) {
		cards.push({
			title: "CPU",
			value: formatPercent(snapshot.cpu.data.overallLoadPercent),
			detail: `${snapshot.cpu.data.perCoreLoadPercent.length} cores sampled`,
			variant: "success",
		});
	} else {
		cards.push({
			title: "CPU",
			value: "Unavailable",
			detail: snapshot.cpu.message,
			variant: "destructive",
		});
	}

	if (isMetricOk(snapshot.memory)) {
		cards.push({
			title: "Memory",
			value: formatBytes(snapshot.memory.data.usedBytes),
			detail: `${formatPercent(snapshot.memory.data.utilizationPercent)} of ${formatBytes(snapshot.memory.data.totalBytes)}`,
			variant: "success",
		});
	} else {
		cards.push({
			title: "Memory",
			value: "Unavailable",
			detail: snapshot.memory.message,
			variant: "destructive",
		});
	}

	if (isMetricOk(snapshot.disk)) {
		const primaryVolume = snapshot.disk.data.volumes[0];
		cards.push({
			title: "Disk",
			value: formatOps(snapshot.disk.data.io.totalOpsPerSecond),
			detail: primaryVolume
				? `${primaryVolume.mount || primaryVolume.name} · ${formatPercent(primaryVolume.utilizationPercent)} full`
				: "No mounted volumes reported",
			variant:
				snapshot.disk.data.io.totalOpsPerSecond === null
					? "warning"
					: "success",
		});
	} else {
		cards.push({
			title: "Disk",
			value: "Unavailable",
			detail: snapshot.disk.message,
			variant: "destructive",
		});
	}

	if (isMetricOk(snapshot.processes)) {
		cards.push({
			title: "Processes",
			value: `${snapshot.processes.data.running}`,
			detail: `${snapshot.processes.data.total} total running processes`,
			variant: "secondary",
		});
	} else {
		cards.push({
			title: "Processes",
			value: "Unavailable",
			detail: snapshot.processes.message,
			variant: "destructive",
		});
	}

	if (isMetricOk(snapshot.network)) {
		const defaultInterface =
			snapshot.network.data.interfaces.find(
				(networkInterface) => networkInterface.isDefault,
			) ?? snapshot.network.data.interfaces[0];
		const hasLiveRates = snapshot.network.data.interfaces.some(hasLiveRate);
		cards.push({
			title: "Network",
			value: defaultInterface
				? `${formatRate(defaultInterface.receivedBytesPerSecond)} ↓`
				: "No interfaces",
			detail: defaultInterface
				? `${defaultInterface.displayName || defaultInterface.name} · ↑ ${formatRate(defaultInterface.transmittedBytesPerSecond)}`
				: "Network interfaces unavailable",
			variant: hasLiveRates ? "success" : "warning",
		});
	} else {
		cards.push({
			title: "Network",
			value: "Unavailable",
			detail: snapshot.network.message,
			variant: "destructive",
		});
	}

	return cards;
}

function hasLiveRate(networkInterface: NetworkInterfaceSnapshot) {
	return (
		networkInterface.receivedBytesPerSecond !== null ||
		networkInterface.transmittedBytesPerSecond !== null
	);
}

function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return "0 B";
	}

	const units = ["B", "KB", "MB", "GB", "TB"];
	let value = bytes;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}

	return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatPercent(value: number): string {
	if (!Number.isFinite(value)) {
		return "0.0%";
	}

	return `${value.toFixed(1)}%`;
}

function formatRate(bytesPerSecond: number | null): string {
	if (bytesPerSecond === null) {
		return "warming up";
	}

	return `${formatBytes(bytesPerSecond)}/s`;
}

function formatOps(opsPerSecond: number | null): string {
	if (opsPerSecond === null) {
		return "warming up";
	}

	return `${Math.round(opsPerSecond)}/s`;
}

function formatTime(value: string): string {
	return new Date(value).toLocaleTimeString();
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Unknown monitoring bridge error.";
}
