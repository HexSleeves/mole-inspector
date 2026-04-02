import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const STAT_KEYS = ["stat-1", "stat-2", "stat-3"] as const;
const DETAIL_KEYS = ["detail-1", "detail-2", "detail-3", "detail-4"] as const;

export function MetricPanelSkeleton() {
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-4 w-72 max-w-full" />
			</CardHeader>
			<CardContent className="px-5 pb-5">
				<div className="space-y-4">
					<div className="grid gap-3 sm:grid-cols-3">
						{STAT_KEYS.map((key) => (
							<div
								key={key}
								className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5"
							>
								<Skeleton className="h-3 w-20" />
								<Skeleton className="mt-1.5 h-8 w-24" />
							</div>
						))}
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between gap-3">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-16" />
						</div>
						<Skeleton className="h-2.5 w-full rounded-full" />
						<Skeleton className="h-4 w-full" />
					</div>
					<div className="grid gap-2.5 sm:grid-cols-2">
						{DETAIL_KEYS.map((key) => (
							<div
								key={key}
								className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5"
							>
								<div className="flex items-center justify-between gap-3">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-12" />
								</div>
								<Skeleton className="h-2.5 w-full rounded-full" />
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
