import type { ReactNode } from "react";

import {
	ErrorBoundary,
	type ErrorBoundaryFallbackProps,
} from "./ui/error-boundary";
import { Button } from "./ui/button";

type AppErrorBoundaryProps = {
	children: ReactNode;
};

export function AppErrorFallback({ error }: ErrorBoundaryFallbackProps) {
	const message =
		error.message || "An unexpected error prevented the dashboard from loading.";

	return (
		<div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-slate-50">
			<div className="w-full max-w-xl rounded-3xl border border-rose-400/30 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/60">
				<div className="space-y-3">
					<p className="text-sm font-medium uppercase tracking-[0.24em] text-rose-200/80">
						Application error
					</p>
					<h1 className="text-3xl font-semibold tracking-tight text-white">
						Something went wrong
					</h1>
					<p className="text-sm leading-6 text-slate-300">
						The dashboard hit an unexpected error and cannot recover automatically.
						 Reload the app to try again.
					</p>
				</div>
				<div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100/90">
					{message}
				</div>
				<div className="mt-6">
					<Button
						type="button"
						onClick={() => {
							if (typeof window !== "undefined") {
								window.location.reload();
							}
						}}
					>
						Reload
					</Button>
				</div>
			</div>
		</div>
	);
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
	return <ErrorBoundary fallback={AppErrorFallback}>{children}</ErrorBoundary>;
}