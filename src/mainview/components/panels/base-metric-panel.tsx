import type { ReactNode } from "react";

import type { MetricResult } from "../../../shared/monitoring";
import { isMetricOk } from "../../../shared/monitoring";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { InlineMessage } from "../ui/inline-message";

type MetricPanelProps<T> = {
	title: string;
	description: string;
	metric: MetricResult<T>;
	children: (data: T) => ReactNode;
};

/**
 * Renders a shared card shell for metric panels with built-in unavailable-state handling.
 */
export function MetricPanel<T>({
	title,
	description,
	metric,
	children,
}: MetricPanelProps<T>) {
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="px-5 pb-5">
				{!isMetricOk(metric) ? (
					<InlineMessage variant="warning">{metric.message}</InlineMessage>
				) : (
					children(metric.data)
				)}
			</CardContent>
		</Card>
	);
}