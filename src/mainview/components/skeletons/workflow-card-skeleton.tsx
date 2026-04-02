import { Skeleton } from "../ui/skeleton";

export function WorkflowCardSkeleton() {
	return (
		<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1.5">
					<div className="flex flex-wrap items-center gap-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-5 w-20 rounded-full" />
						<Skeleton className="h-5 w-24 rounded-full" />
					</div>
					<Skeleton className="h-4 w-full max-w-sm" />
					<Skeleton className="h-4 w-5/6 max-w-xs" />
				</div>
				<Skeleton className="h-6 w-20 rounded-full" />
			</div>
			<div className="mt-3 flex flex-wrap gap-2">
				<Skeleton className="h-9 w-28 rounded-md" />
				<Skeleton className="h-9 w-24 rounded-md" />
			</div>
		</div>
	);
}
