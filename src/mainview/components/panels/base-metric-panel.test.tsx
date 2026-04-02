import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Badge, Button, Card } from "../ui";
import { CpuPanel, MetricPanel, PanelErrorBoundary } from "./index";

describe("UI barrel exports", () => {
	test("exports common UI primitives", () => {
		expect(Button).toBeTruthy();
		expect(Badge).toBeTruthy();
		expect(Card).toBeTruthy();
	});
});

describe("panel barrel exports", () => {
	test("exports panel primitives", () => {
		expect(CpuPanel).toBeTruthy();
		expect(MetricPanel).toBeTruthy();
		expect(PanelErrorBoundary).toBeTruthy();
	});
});

describe("MetricPanel", () => {
	test("renders provided content for successful metrics", () => {
		const markup = renderToStaticMarkup(
			<MetricPanel
				title="CPU load"
				description="Current CPU usage"
				metric={{ status: "ok", data: { value: "42%" } }}
			>
				{(data) => <div>{data.value}</div>}
			</MetricPanel>,
		);

		expect(markup).toContain("CPU load");
		expect(markup).toContain("Current CPU usage");
		expect(markup).toContain("42%");
	});

	test("renders warning feedback for failed metrics", () => {
		const markup = renderToStaticMarkup(
			<MetricPanel
				title="Memory"
				description="Live memory usage"
				metric={{ status: "error", message: "Memory collector unavailable" }}
			>
				{() => <div>should not render</div>}
			</MetricPanel>,
		);

		expect(markup).toContain("Memory collector unavailable");
		expect(markup).not.toContain("should not render");
	});
});