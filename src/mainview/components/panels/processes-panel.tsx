import {
	isMetricOk,
	type MonitoringSnapshot,
	type ProcessSnapshot,
} from "../../../shared/monitoring";
import { formatBytes, formatPercent } from "../../lib/format";
import { Badge } from "../ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { InlineMessage } from "../ui/inline-message";
import { ScrollArea } from "../ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";

type ProcessesPanelProps = {
	metric: MonitoringSnapshot["processes"];
	processLimit: number;
};

type ProcessRowProps = {
	process: ProcessSnapshot;
};

export function ProcessesPanel({
	metric,
	processLimit,
}: ProcessesPanelProps) {
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>Process activity</CardTitle>
				<CardDescription>
					Top processes by CPU, including PID, memory usage, and owner.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-5 pb-5">
				{!isMetricOk(metric) ? (
					<InlineMessage variant="warning">{metric.message}</InlineMessage>
				) : metric.data.list.length === 0 ? (
					<InlineMessage variant="empty">
						The collector did not return any running processes.
					</InlineMessage>
				) : (
					<div className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
							<p>
								Showing the top {metric.data.list.length} of {metric.data.total}{" "}
								processes.
							</p>
							<Badge variant="secondary">limit {processLimit}</Badge>
						</div>

						<ScrollArea className="h-[min(58vh,34rem)] min-h-72 rounded-xl border border-slate-800">
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

export function ProcessRow({ process }: ProcessRowProps) {
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