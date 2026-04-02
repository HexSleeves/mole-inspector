import { isMetricOk, type MonitoringSnapshot } from "../../../shared/monitoring";
import { formatPercent } from "../../lib/format";
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

type CpuPanelProps = {
	metric: MonitoringSnapshot["cpu"];
};

export function CpuPanel({ metric }: CpuPanelProps) {
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>CPU load</CardTitle>
				<CardDescription>
					Overall load, user/system split, and per-core activity.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-5 pb-5">
				{!isMetricOk(metric) ? (
					<InlineMessage variant="warning">{metric.message}</InlineMessage>
				) : (
					<div className="space-y-4">
						<div className="grid gap-3 sm:grid-cols-3">
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
						<div className="grid gap-2.5 sm:grid-cols-2">
							{metric.data.perCoreLoadPercent.map((coreLoad, index) => (
								<div
									key={`core-${index}`}
									className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5"
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