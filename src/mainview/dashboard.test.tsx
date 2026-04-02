import { describe, expect, test } from "bun:test";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const bridge = {
	getMonitoringSnapshot: async () => {
		throw new Error("not used in this test");
	},
	getMoleStatus: async () => {
		throw new Error("not used in this test");
	},
	runMoleWorkflow: async () => {
		throw new Error("not used in this test");
	},
};

describe("dashboard async-state notices", () => {
	test("renders explicit first-load guidance", async () => {
		(globalThis as { window?: unknown }).window = {
			__monitoringFoundationBridge: bridge,
		};

		const module = await import("./dashboard");
		const DashboardStatusNotice = (
			module as {
				DashboardStatusNotice?: ComponentType<{
					mode: "initial-loading" | "refreshing" | "stale" | null;
					lastUpdatedLabel?: string | null;
					errorMessage?: string | null;
					unavailableMetricCount?: number;
				}>;
			}
		).DashboardStatusNotice;

		expect(typeof DashboardStatusNotice).toBe("function");
		if (!DashboardStatusNotice) {
			throw new Error("DashboardStatusNotice export is missing");
		}

		const markup = renderToStaticMarkup(
			<DashboardStatusNotice
				mode="initial-loading"
				unavailableMetricCount={0}
			/>,
		);

		expect(markup).toContain("Collecting the first dashboard sample");
		expect(markup).toContain("summary cards and live panels");
	});

	test("surfaces stale-sample and partial-failure context together", async () => {
		(globalThis as { window?: unknown }).window = {
			__monitoringFoundationBridge: bridge,
		};

		const module = await import("./dashboard");
		const DashboardStatusNotice = (
			module as {
				DashboardStatusNotice?: ComponentType<{
					mode: "initial-loading" | "refreshing" | "stale" | null;
					lastUpdatedLabel?: string | null;
					errorMessage?: string | null;
					unavailableMetricCount?: number;
				}>;
			}
		).DashboardStatusNotice;

		expect(typeof DashboardStatusNotice).toBe("function");
		if (!DashboardStatusNotice) {
			throw new Error("DashboardStatusNotice export is missing");
		}

		const markup = renderToStaticMarkup(
			<DashboardStatusNotice
				mode="stale"
				lastUpdatedLabel="11:42:00 AM"
				errorMessage="IPC timeout"
				unavailableMetricCount={2}
			/>,
		);

		expect(markup).toContain(
			"Still showing the previous sample from 11:42:00 AM",
		);
		expect(markup).toContain("IPC timeout");
		expect(markup).toContain("2 sections reported collector issues");
	});
});
