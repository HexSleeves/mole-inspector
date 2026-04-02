import {
	isMetricOk,
	type MonitoringSnapshot,
	type NetworkInterfaceSnapshot,
	type NetworkSnapshot,
} from "../../../shared/monitoring";
import { formatRate } from "../../lib/format";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";
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

type NetworkPanelProps = {
	metric: MonitoringSnapshot["network"];
};

type NetworkContentProps = {
	data: NetworkSnapshot;
};

export function NetworkPanel({ metric }: NetworkPanelProps) {
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>Network activity</CardTitle>
				<CardDescription>
					Interface identity plus live throughput when the macOS collector
					exposes stable samples.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-5 pb-5">
				{!isMetricOk(metric) ? (
					<InlineMessage variant="warning">{metric.message}</InlineMessage>
				) : (
					<NetworkContent data={metric.data} />
				)}
			</CardContent>
		</Card>
	);
}

export function NetworkContent({ data }: NetworkContentProps) {
	if (data.interfaces.length === 0) {
		return (
			<InlineMessage variant="empty">
				No network interfaces were reported on this machine.
			</InlineMessage>
		);
	}

	const defaultInterface =
		data.interfaces.find((networkInterface) => networkInterface.isDefault) ??
		data.interfaces[0];
	const hasLiveRates = data.interfaces.some(hasLiveRate);

	return (
		<div className="space-y-3">
			<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
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

				<div className="mt-3 grid gap-3 sm:grid-cols-2">
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
				<InlineMessage variant="warning">
					The current macOS collector can identify interfaces immediately, but
					byte-per-second throughput may need an additional sample before it
					stabilizes.
				</InlineMessage>
			) : null}

			<Accordion type="single" defaultValue="interfaces">
				<AccordionItem value="interfaces">
					<AccordionTrigger>Interface details</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-2">
							{data.interfaces.slice(0, 4).map((networkInterface) => (
								<div
									key={networkInterface.name}
									className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm"
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
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

export function hasLiveRate(networkInterface: NetworkInterfaceSnapshot) {
	return (
		networkInterface.receivedBytesPerSecond !== null ||
		networkInterface.transmittedBytesPerSecond !== null
	);
}