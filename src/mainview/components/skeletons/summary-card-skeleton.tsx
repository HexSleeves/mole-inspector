import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function SummaryCardSkeleton() {
	return (
		<Card>
			<CardHeader className="px-4 pb-2 pt-4">
				<div className="flex items-center justify-between gap-3">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
			</CardHeader>
			<CardContent className="space-y-1.5 px-4 pb-4">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-full" />
			</CardContent>
		</Card>
	);
}
