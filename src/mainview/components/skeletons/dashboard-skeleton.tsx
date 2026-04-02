import { MetricPanelSkeleton } from "./metric-panel-skeleton";
import { SummaryCardSkeleton } from "./summary-card-skeleton";

const SUMMARY_CARD_KEYS = [
	"summary-1",
	"summary-2",
	"summary-3",
	"summary-4",
	"summary-5",
] as const;

const METRIC_PANEL_KEYS = [
	"metric-1",
	"metric-2",
	"metric-3",
	"metric-4",
] as const;

export function DashboardSkeleton() {
	return (
		<>
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				{SUMMARY_CARD_KEYS.map((key) => (
					<SummaryCardSkeleton key={key} />
				))}
			</section>
			<section className="grid gap-4 xl:grid-cols-2">
				{METRIC_PANEL_KEYS.map((key) => (
					<MetricPanelSkeleton key={key} />
				))}
			</section>
		</>
	);
}
