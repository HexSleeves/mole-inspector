import { isMetricOk, type MonitoringSnapshot } from "../../../shared/monitoring";
import { formatBytes, formatOps, formatPercent, formatRate } from "../../lib/format";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { hasLiveRate } from "./network-panel";

export type SummaryCard = {
	title: string;
	value: string;
	detail: string;
	variant: "success" | "warning" | "destructive" | "secondary";
};

type SummaryMetricCardProps = {
	card: SummaryCard;
};

export function SummaryMetricCard({ card }: SummaryMetricCardProps) {
	return (
		<Card>
			<CardHeader className="px-4 pb-2 pt-4">
				<div className="flex items-center justify-between gap-3">
					<CardTitle className="text-sm">{card.title}</CardTitle>
					<Badge variant={card.variant}>{card.variant}</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-1.5 px-4 pb-4">
				<p className="text-2xl font-semibold text-slate-50">{card.value}</p>
				<p className="text-sm text-slate-400">{card.detail}</p>
			</CardContent>
		</Card>
	);
}

export function buildSummaryCards(snapshot: MonitoringSnapshot): SummaryCard[] {
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