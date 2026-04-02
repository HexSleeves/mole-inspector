import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AppErrorFallback } from "./app-error-boundary";
import { PanelErrorFallback } from "./panels/panel-error-boundary";

describe("error boundary wrappers", () => {
	test("renders the app-level fallback copy", () => {
		const markup = renderToStaticMarkup(
			<AppErrorFallback
				error={new Error("renderer crashed")}
				resetErrorBoundary={() => {}}
			/>,
		);

		expect(markup).toContain("Application error");
		expect(markup).toContain("renderer crashed");
		expect(markup).toContain("Reload");
	});

	test("renders the panel-level fallback copy", () => {
		const markup = renderToStaticMarkup(
			<PanelErrorFallback
				error={new Error("disk metric failed")}
				panelName="Disk"
				resetErrorBoundary={() => {}}
			/>,
		);

		expect(markup).toContain("Disk error");
		expect(markup).toContain("disk metric failed");
		expect(markup).toContain("Try again");
	});
});