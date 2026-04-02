import { isMetricOk, type MonitoringSnapshot } from "../../../shared/monitoring";
import { formatBytes, formatOps } from "../../lib/format";
import { Badge } from "../ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { InlineMessage } from "../ui/inline-message";
import { MetricStat } from "../ui/metric-stat";
import { Progress } from "../ui/progress";

type DiskPanelProps = {
	metric: MonitoringSnapshot["disk"];
};

export function DiskPanel({ metric }: DiskPanelProps) {
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>Disk capacity and I/O</CardTitle>
				<CardDescription>
					Mounted volumes and live read/write operations when available.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-5 pb-5">
				{!isMetricOk(metric) ? (
					<InlineMessage variant="warning">{metric.message}</InlineMessage>
				) : metric.data.volumes.length === 0 ? (
					<InlineMessage variant="empty">
						No mounted volumes were reported by the collector.
					</InlineMessage>
				) : (
					<div className="space-y-4">
						<div className="grid gap-3 sm:grid-cols-3">
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

						<div className="space-y-2.5">
							{metric.data.volumes.slice(0, 4).map((volume) => (
								<div
									key={`${volume.mount}-${volume.name}`}
									className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5"
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