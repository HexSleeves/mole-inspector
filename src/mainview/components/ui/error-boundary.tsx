import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export type ErrorBoundaryFallbackProps = {
	error: Error;
	resetErrorBoundary: () => void;
};

type ErrorBoundaryProps = {
	children: ReactNode;
	fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
	error: Error | null;
};

/**
 * Catches render failures in a subtree and renders a fallback UI instead of crashing the app.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = {
		error: null,
	};

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.props.onError?.(error, errorInfo);
	}

	resetErrorBoundary = () => {
		this.setState({ error: null });
	};

	render() {
		const { children, fallback } = this.props;
		const { error } = this.state;

		if (!error) {
			return children;
		}

		if (typeof fallback === "function") {
			return fallback({
				error,
				resetErrorBoundary: this.resetErrorBoundary,
			});
		}

		if (fallback) {
			return fallback;
		}

		const message =
			error.message || "An unexpected error occurred while rendering this view.";

		return (
			<Card className="border-rose-400/30 bg-rose-400/10">
				<CardHeader className="gap-1.5 px-5 pb-3 pt-5">
					<CardTitle>Something went wrong</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 px-5 pb-5">
					<p className="text-sm leading-6 text-rose-100/80">{message}</p>
					<Button type="button" variant="outline" onClick={this.resetErrorBoundary}>
						Try again
					</Button>
				</CardContent>
			</Card>
		);
	}
}