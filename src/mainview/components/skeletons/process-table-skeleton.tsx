import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";

const ROW_KEYS = ["row-1", "row-2", "row-3", "row-4", "row-5"] as const;

export function ProcessTableSkeleton() {
	return (
		<Card>
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<Skeleton className="h-5 w-36" />
				<Skeleton className="h-4 w-80 max-w-full" />
			</CardHeader>
			<CardContent className="space-y-3 px-5 pb-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Skeleton className="h-4 w-52" />
					<Skeleton className="h-6 w-16 rounded-full" />
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
							{ROW_KEYS.map((key) => (
								<TableRow key={key}>
									<TableCell>
										<Skeleton className="h-4 w-12" />
									</TableCell>
									<TableCell>
										<div className="space-y-1.5">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-3 w-16" />
										</div>
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-14" />
									</TableCell>
									<TableCell>
										<div className="space-y-1.5">
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-3 w-20" />
										</div>
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-20" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-16" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
