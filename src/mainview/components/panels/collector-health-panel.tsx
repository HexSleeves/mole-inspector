import {
	isMetricOk,
	type MetricResult,
	type MonitoringSnapshot,
} from "../../../shared/monitoring";
import { Badge } from "../ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../ui/collapsible";
import { InlineMessage } from "../ui/inline-message";

type CollectorHealthPanelProps = {
	queryError: string | null;
	snapshot: MonitoringSnapshot;
};

export function CollectorHealthPanel({
	queryError,
	snapshot,
}: CollectorHealthPanelProps) {
	const metricRows: Array<{ label: string; metric: MetricResult<unknown> }> = [
		{ label: "CPU", metric: snapshot.cpu },
		{ label: "Memory", metric: snapshot.memory },
		{ label: "Disk", metric: snapshot.disk },
		{ label: "Processes", metric: snapshot.processes },
		{ label: "Network", metric: snapshot.network },
	];
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>Collector health</CardTitle>
				<CardDescription>
					Each panel stays resilient to partial collector failures instead of
					crashing the renderer.
				</CardDescription>
			</CardHeader>

			<CardContent className="px-5 pb-5">
				<Collapsible defaultOpen={false}>
					<CollapsibleTrigger>Collector health details</CollapsibleTrigger>
					<CollapsibleContent className="border-0 bg-transparent">
						<div className="space-y-2.5">
							{metricRows.map(({ label, metric }) => (
								<div
									key={label}
									className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm"
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
								<InlineMessage variant="warning">
									The last live refresh failed, so the dashboard is still showing
									the previous sample: {queryError}
								</InlineMessage>
							) : null}
						</div>
					</CollapsibleContent>
				</Collapsible>
			</CardContent>
		</Card>
	);
}