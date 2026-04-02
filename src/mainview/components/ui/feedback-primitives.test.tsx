import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { ErrorInfo, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { useToastStore } from "../../store/toast-store";
import { ErrorBoundary } from "./error-boundary";
import { InlineMessage } from "./inline-message";
import { Skeleton } from "./skeleton";
import { Toaster } from "./toast";

function renderNode(node: ReactNode) {
	return renderToStaticMarkup(<>{node}</>);
}

function setBoundaryError(boundary: ErrorBoundary, error: Error) {
	(boundary as unknown as { state: { error: Error | null } }).state =
		ErrorBoundary.getDerivedStateFromError(error);
}

afterEach(() => {
	for (const toast of useToastStore.getState().toasts) {
		useToastStore.getState().dismissToast(toast.id);
	}
});

describe("Skeleton", () => {
	test("renders pulse styling with configurable dimensions", () => {
		const markup = renderToStaticMarkup(
			<Skeleton className="extra-class" height="2rem" width={120} />,
		);

		expect(markup).toContain("animate-pulse");
		expect(markup).toContain("bg-slate-800");
		expect(markup).toContain("rounded");
		expect(markup).toContain("extra-class");
		expect(markup).toContain("width:120px");
		expect(markup).toContain("height:2rem");
	});
});

describe("InlineMessage", () => {
	test("uses alert semantics for error and warning variants", () => {
		const errorMarkup = renderToStaticMarkup(
			<InlineMessage variant="error">Something failed</InlineMessage>,
		);
		const warningMarkup = renderToStaticMarkup(
			<InlineMessage variant="warning">Heads up</InlineMessage>,
		);
		const emptyMarkup = renderToStaticMarkup(
			<InlineMessage variant="empty">Nothing to show yet</InlineMessage>,
		);

		expect(errorMarkup).toContain('role="alert"');
		expect(errorMarkup).toContain("border-rose-400/20");
		expect(warningMarkup).toContain('role="alert"');
		expect(warningMarkup).toContain("border-amber-400/20");
		expect(emptyMarkup).not.toContain('role="alert"');
		expect(emptyMarkup).toContain("bg-slate-900/60");
	});
});

describe("Toaster", () => {
	test("defines live region and portal semantics in the renderer", () => {
		const source = readFileSync(new URL("./toast.tsx", import.meta.url), "utf8");

		expect(typeof Toaster).toBe("function");
		expect(source).toContain('aria-live="polite"');
		expect(source).toContain('role="status"');
		expect(source).toContain("createPortal(content, document.body)");
	});
});

describe("ErrorBoundary", () => {
	test("renders children before an error is captured", () => {
		const boundary = new ErrorBoundary({ children: <span>Healthy tree</span> });

		expect(renderNode(boundary.render())).toContain("Healthy tree");
	});

	test("renders the default fallback and forwards caught errors", () => {
		let reportedMessage: string | null = null;
		const boundary = new ErrorBoundary({
			children: <span>Healthy tree</span>,
			onError: (error) => {
				reportedMessage = error.message;
			},
		});
		const error = new Error("boom");

		boundary.componentDidCatch(error, {
			componentStack: "\n    in Example",
		} as ErrorInfo);
		setBoundaryError(boundary, error);

		const markup = renderNode(boundary.render());

			expect(String(reportedMessage)).toBe("boom");
		expect(markup).toContain("Something went wrong");
		expect(markup).toContain("boom");
		expect(markup).toContain("Try again");
	});

	test("supports a custom fallback render function", () => {
		const boundary = new ErrorBoundary({
			children: <span>Healthy tree</span>,
			fallback: ({ error }) => <div>Custom fallback: {error.message}</div>,
		});
		setBoundaryError(boundary, new Error("kaput"));

		expect(renderNode(boundary.render())).toContain("Custom fallback: kaput");
	});
});