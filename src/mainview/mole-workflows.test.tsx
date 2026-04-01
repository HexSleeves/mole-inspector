import { describe, expect, test } from "bun:test";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { MoleCommandResult, MoleWorkflowMode } from "../shared/mole";

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

describe("Mole workflow visibility helpers", () => {
	test("renders explicit queued and running execution states", async () => {
		(globalThis as { window?: unknown }).window = {
			__monitoringFoundationBridge: bridge,
		};

		const module = await import("./mole-workflows");
		const ExecutionStatusPanel = (module as {
			ExecutionStatusPanel?: ComponentType<{
				execution: {
					workflowId: "clean";
					mode: MoleWorkflowMode;
					status: "queued" | "running";
					queuedAt: string;
				};
			}>;
		}).ExecutionStatusPanel;

		expect(typeof ExecutionStatusPanel).toBe("function");
		if (!ExecutionStatusPanel) {
			throw new Error("ExecutionStatusPanel export is missing");
		}

		const queuedMarkup = renderToStaticMarkup(
			<ExecutionStatusPanel
				execution={{
					workflowId: "clean",
					mode: "apply",
					status: "queued",
					queuedAt: "2026-04-01T20:30:00.000Z",
				}}
			/>,
		);
		const runningMarkup = renderToStaticMarkup(
			<ExecutionStatusPanel
				execution={{
					workflowId: "clean",
					mode: "apply",
					status: "running",
					queuedAt: "2026-04-01T20:30:00.000Z",
				}}
			/>,
		);

		expect(queuedMarkup).toContain("Queued");
		expect(queuedMarkup).toContain("mo clean");
		expect(runningMarkup).toContain("Running");
		expect(runningMarkup).toContain("clean");
	});

	test("renders an explicit success message for no-output completions", async () => {
		(globalThis as { window?: unknown }).window = {
			__monitoringFoundationBridge: bridge,
		};

		const module = await import("./mole-workflows");
		const CommandResultPanel = (module as {
			CommandResultPanel?: ComponentType<{ result: MoleCommandResult }>;
		}).CommandResultPanel;

		expect(typeof CommandResultPanel).toBe("function");
		if (!CommandResultPanel) {
			throw new Error("CommandResultPanel export is missing");
		}

		const markup = renderToStaticMarkup(
			<CommandResultPanel
				result={{
					workflowId: "optimize",
					mode: "apply",
					command: ["mo", "optimize"],
					ok: true,
					exitCode: 0,
					startedAt: "2026-04-01T20:30:00.000Z",
					finishedAt: "2026-04-01T20:30:01.000Z",
					durationMs: 1_000,
					stdout: "",
					stderr: "",
					combinedOutput: "",
					outputState: "empty",
					error: null,
				}}
			/>,
		);

		expect(markup).toContain("success");
		expect(markup).toContain("did not emit stdout or stderr");
	});
});
