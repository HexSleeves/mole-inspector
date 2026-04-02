import type { ReactNode } from "react";

import {
	ErrorBoundary,
	type ErrorBoundaryFallbackProps,
} from "../ui/error-boundary";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type PanelErrorBoundaryProps = {
	children: ReactNode;
	panelName: string;
};

type PanelErrorFallbackProps = ErrorBoundaryFallbackProps & {
	panelName: string;
};

export function PanelErrorFallback({
	error,
	panelName,
	resetErrorBoundary,
}: PanelErrorFallbackProps) {
	return (
		<Card className="border-rose-400/30 bg-rose-400/10">
			<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
				<CardTitle>{panelName} error</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 px-5 pb-5">
				<p className="text-sm text-rose-100/80">{error.message}</p>
				<Button type="button" variant="outline" onClick={resetErrorBoundary}>
					Try again
				</Button>
			</CardContent>
		</Card>
	);
}

export function PanelErrorBoundary({
	children,
	panelName,
}: PanelErrorBoundaryProps) {
	return (
		<ErrorBoundary
			fallback={(props) => (
				<PanelErrorFallback {...props} panelName={panelName} />
			)}
		>
			{children}
		</ErrorBoundary>
	);
}