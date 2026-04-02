import { isMetricOk, type MonitoringSnapshot } from "../../../shared/monitoring";
import { formatBytes, formatPercent } from "../../lib/format";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { InlineMessage } from "../ui/inline-message";
import { Progress } from "../ui/progress";

type MemoryPanelProps = {
	metric: MonitoringSnapshot["memory"];
};

export function MemoryPanel({ metric }: MemoryPanelProps) {
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>Memory pressure</CardTitle>
				<CardDescription>
					Live RAM usage, excluding reclaimable macOS cache, with swap and
					available headroom.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-5 pb-5">
				{!isMetricOk(metric) ? (
					<InlineMessage variant="warning">{metric.message}</InlineMessage>
				) : (
					<div className="space-y-4">
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