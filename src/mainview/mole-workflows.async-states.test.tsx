import { describe, expect, test } from "bun:test";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { MoleWorkflowMode } from "../shared/mole";

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

describe("Mole async-state notices", () => {
	test("renders explicit Mole availability loading guidance", async () => {
		(globalThis as { window?: unknown }).window = {
			__monitoringFoundationBridge: bridge,
		};

		const module = await import("./mole-workflows");
		const MoleWorkflowStatusNotice = (
			module as {
				MoleWorkflowStatusNotice?: ComponentType<{
					statusMode: "loading" | "refreshing" | "running" | null;
					activeExecution?: {
						workflowId: "clean";
						mode: MoleWorkflowMode;
						status: "queued" | "running";
						queuedAt: string;
					} | null;
				}>;
			}
		).MoleWorkflowStatusNotice;

		expect(typeof MoleWorkflowStatusNotice).toBe("function");
		if (!MoleWorkflowStatusNotice) {
			throw new Error("MoleWorkflowStatusNotice export is missing");
		}

		const markup = renderToStaticMarkup(
			<MoleWorkflowStatusNotice statusMode="loading" activeExecution={null} />,
		);

		expect(markup).toContain("Checking Mole availability");
		expect(markup).toContain("optimization commands");
	});

	test("renders running guidance next to workflow controls", async () => {
		(globalThis as { window?: unknown }).window = {
			__monitoringFoundationBridge: bridge,
		};

		const module = await import("./mole-workflows");
		const MoleWorkflowStatusNotice = (
			module as {
				MoleWorkflowStatusNotice?: ComponentType<{
					statusMode: "loading" | "refreshing" | "running" | null;
					activeExecution?: {
						workflowId: "clean";
						mode: MoleWorkflowMode;
						status: "queued" | "running";
						queuedAt: string;
					} | null;
				}>;
			}
		).MoleWorkflowStatusNotice;

		expect(typeof MoleWorkflowStatusNotice).toBe("function");
		if (!MoleWorkflowStatusNotice) {
			throw new Error("MoleWorkflowStatusNotice export is missing");
		}

		const markup = renderToStaticMarkup(
			<MoleWorkflowStatusNotice
				statusMode="running"
				activeExecution={{
					workflowId: "clean",
					mode: "apply",
					status: "running",
					queuedAt: "2026-04-01T20:30:00.000Z",
				}}
			/>,
		);

		expect(markup).toContain("Clean caches and logs");
		expect(markup).toContain("buttons stay disabled until Mole finishes");
	});
});
