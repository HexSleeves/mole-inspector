import { useEffect, useMemo, useState } from "react";

import {
	DEFAULT_PROCESS_LIMIT,
	MONITORING_POLL_INTERVAL_MS,
	isMetricOk,
	type MonitoringSnapshot,
} from "../shared/monitoring";
import { monitoringBridge } from "./monitoring";

type FoundationCard = {
	title: string;
	status: "ok" | "error";
	summary: string;
	detail: string;
};

function App() {
	const [snapshot, setSnapshot] = useState<MonitoringSnapshot | null>(null);
	const [loadingError, setLoadingError] = useState<string | null>(null);

	useEffect(() => {
		let isActive = true;

		const refresh = async () => {
			try {
				const nextSnapshot = await monitoringBridge.getMonitoringSnapshot({
					processLimit: DEFAULT_PROCESS_LIMIT,
				});

				if (!isActive) {
					return;
				}

				setSnapshot(nextSnapshot);
				setLoadingError(null);
			} catch (error) {
				if (!isActive) {
					return;
				}

				setLoadingError(
					error instanceof Error
						? error.message
						: "Unable to reach the monitoring bridge.",
				);
			}
		};

		void refresh();
		const intervalId = window.setInterval(() => {
			void refresh();
		}, MONITORING_POLL_INTERVAL_MS);

		return () => {
			isActive = false;
			window.clearInterval(intervalId);
		};
	}, []);

	const cards = useMemo<FoundationCard[]>(() => {
		if (!snapshot) {
			return [];
		}

		const nextCards: FoundationCard[] = [];

		if (isMetricOk(snapshot.cpu)) {
			nextCards.push({
				title: "CPU",
				status: "ok",
				summary: `${formatPercent(snapshot.cpu.data.overallLoadPercent)} overall load`,
				detail: `${snapshot.cpu.data.perCoreLoadPercent.length} cores sampled`,
			});
		} else {
			nextCards.push({
				title: "CPU",
				status: "error",
				summary: "Metric unavailable",
				detail: snapshot.cpu.message,
			});
		}

		if (isMetricOk(snapshot.memory)) {
			nextCards.push({
				title: "Memory",
				status: "ok",
				summary: `${formatBytes(snapshot.memory.data.usedBytes)} / ${formatBytes(snapshot.memory.data.totalBytes)} used`,
				detail: `Swap ${formatBytes(snapshot.memory.data.swapUsedBytes)} / ${formatBytes(snapshot.memory.data.swapTotalBytes)}`,
			});
		} else {
			nextCards.push({
				title: "Memory",
				status: "error",
				summary: "Metric unavailable",
				detail: snapshot.memory.message,
			});
		}

		if (isMetricOk(snapshot.disk)) {
			const topVolume = snapshot.disk.data.volumes[0];
			const opsPerSecond = snapshot.disk.data.io.totalOpsPerSecond;

			nextCards.push({
				title: "Disk",
				status: "ok",
				summary:
					opsPerSecond === null
						? "I/O counters warming up"
						: `${Math.round(opsPerSecond)} total ops/sec`,
				detail: topVolume
					? `${topVolume.mount || topVolume.name} • ${formatPercent(topVolume.utilizationPercent)} full`
					: "No mounted volumes detected",
			});
		} else {
			nextCards.push({
				title: "Disk",
				status: "error",
				summary: "Metric unavailable",
				detail: snapshot.disk.message,
			});
		}

		if (isMetricOk(snapshot.processes)) {
			const topProcess = snapshot.processes.data.list[0];

			nextCards.push({
				title: "Processes",
				status: "ok",
				summary: `${snapshot.processes.data.running} running / ${snapshot.processes.data.total} total`,
				detail: topProcess
					? `${topProcess.name} • ${formatPercent(topProcess.cpuPercent)} CPU`
					: "No process details returned",
			});
		} else {
			nextCards.push({
				title: "Processes",
				status: "error",
				summary: "Metric unavailable",
				detail: snapshot.processes.message,
			});
		}

		if (isMetricOk(snapshot.network)) {
			const defaultInterface =
				snapshot.network.data.interfaces.find((network) => network.isDefault) ??
				snapshot.network.data.interfaces[0];

			nextCards.push({
				title: "Network",
				status: "ok",
				summary: `${snapshot.network.data.interfaces.length} interfaces sampled`,
				detail: defaultInterface
					? `${defaultInterface.displayName || defaultInterface.name} • ↓ ${formatRate(defaultInterface.receivedBytesPerSecond)} ↑ ${formatRate(defaultInterface.transmittedBytesPerSecond)}`
					: "No interface details returned",
			});
		} else {
			nextCards.push({
				title: "Network",
				status: "error",
				summary: "Metric unavailable",
				detail: snapshot.network.message,
			});
		}

		return nextCards;
	}, [snapshot]);

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
				<header className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/40">
					<p className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-300">
						Wave 1 foundation
					</p>
					<h1 className="text-4xl font-semibold text-white">
						macOS System Optimizer
					</h1>
					<p className="mt-3 max-w-3xl text-base text-slate-300">
						Typed Electrobun monitoring APIs are now polling CPU, memory, disk,
						process, and network metrics from the main process. This foundation
						screen intentionally stays lightweight until the dashboard task adds
						real-time visualizations.
					</p>
					<div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
						<span className="rounded-full border border-slate-700 px-3 py-1">
							Poll interval {MONITORING_POLL_INTERVAL_MS / 1000}s
						</span>
						<span className="rounded-full border border-slate-700 px-3 py-1">
							Top {DEFAULT_PROCESS_LIMIT} processes
						</span>
						{snapshot ? (
							<span className="rounded-full border border-emerald-500/30 px-3 py-1 text-emerald-300">
								Last updated{" "}
								{new Date(snapshot.collectedAt).toLocaleTimeString()}
							</span>
						) : null}
					</div>
				</header>

				{loadingError && !snapshot ? (
					<div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100">
						{loadingError}
					</div>
				) : null}

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
					{cards.map((card) => (
						<article
							key={card.title}
							className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40"
						>
							<div className="flex items-center justify-between gap-3">
								<h2 className="text-lg font-medium text-white">{card.title}</h2>
								<span
									className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${
										card.status === "ok"
											? "bg-emerald-500/15 text-emerald-300"
											: "bg-amber-500/15 text-amber-300"
									}`}
								>
									{card.status}
								</span>
							</div>
							<p className="mt-4 text-2xl font-semibold text-slate-100">
								{card.summary}
							</p>
							<p className="mt-2 text-sm leading-6 text-slate-400">
								{card.detail}
							</p>
						</article>
					))}
				</section>

				<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm leading-7 text-slate-300">
					<p>
						Unavailable process, disk, or network collectors return structured
						error states from the Bun side instead of crashing the renderer. The
						follow-up dashboard task can build richer visuals directly on top of
						this monitoring contract.
					</p>
				</div>
			</div>
		</div>
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
	return `${value.toFixed(1)}%`;
}

function formatRate(bytesPerSecond: number | null): string {
	if (bytesPerSecond === null) {
		return "warming up";
	}

	return `${formatBytes(bytesPerSecond)}/s`;
}

export default App;
