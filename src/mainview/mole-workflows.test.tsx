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

function buildResult(
	overrides: Partial<MoleCommandResult> = {},
): MoleCommandResult {
	return {
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
		...overrides,
	};
}

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

	test("renders newest-first history with the newest result expanded by default", async () => {
		(globalThis as { window?: unknown }).window = {
			__monitoringFoundationBridge: bridge,
		};

		const module = await import("./mole-workflows");
		const CommandResultHistoryPanel = (module as {
			CommandResultHistoryPanel?: ComponentType<{
				results: MoleCommandResult[];
				initialExpandedResultIds?: string[];
			}>;
		}).CommandResultHistoryPanel;

		expect(typeof CommandResultHistoryPanel).toBe("function");
		if (!CommandResultHistoryPanel) {
			throw new Error("CommandResultHistoryPanel export is missing");
		}

		const markup = renderToStaticMarkup(
			<CommandResultHistoryPanel
				results={[
					buildResult({
						workflowId: "purge",
						mode: "preview",
						command: ["mo", "purge", "--dry-run"],
						startedAt: "2026-04-01T20:31:00.000Z",
						finishedAt: "2026-04-01T20:31:01.000Z",
						stdout: "newest output",
						combinedOutput: "newest output",
						outputState: "captured",
					}),
					buildResult({
						workflowId: "clean",
						mode: "apply",
						command: ["mo", "clean"],
						ok: false,
						exitCode: 1,
						startedAt: "2026-04-01T20:30:00.000Z",
						finishedAt: "2026-04-01T20:30:02.000Z",
						stdout: "older stdout",
						stderr: "older stderr",
						combinedOutput: "older stdout\nolder stderr",
						outputState: "captured",
						error: "older failure",
					}),
				]}
			/>,
		);

		expect(markup).toContain("Recent command results");
		expect(markup).toContain("Most recent");
		expect(markup).toContain("newest output");
		expect(markup).not.toContain("older stderr");
		expect(markup).toContain('aria-expanded="true"');
		expect(markup).toContain('aria-expanded="false"');
	});

	test("keeps output details collapsed until the result is expanded", async () => {
		(globalThis as { window?: unknown }).window = {
			__monitoringFoundationBridge: bridge,
		};

		const module = await import("./mole-workflows");
		const CommandResultHistoryPanel = (module as {
			CommandResultHistoryPanel?: ComponentType<{
				results: MoleCommandResult[];
				initialExpandedResultIds?: string[];
			}>;
		}).CommandResultHistoryPanel;

		expect(typeof CommandResultHistoryPanel).toBe("function");
		if (!CommandResultHistoryPanel) {
			throw new Error("CommandResultHistoryPanel export is missing");
		}

		const markup = renderToStaticMarkup(
			<CommandResultHistoryPanel
				results={[
					buildResult({
						stdout: "very long output block",
						combinedOutput: "very long output block",
						outputState: "captured",
						error: "apply failed",
					}),
				]}
				initialExpandedResultIds={[]}
			/>,
		);

		expect(markup).toContain('aria-expanded="false"');
		expect(markup).not.toContain("very long output block");
		expect(markup).not.toContain("apply failed");
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

		const markup = renderToStaticMarkup(<CommandResultPanel result={buildResult()} />);

		expect(markup).toContain("success");
		expect(markup).toContain("did not emit stdout or stderr");
	});

	test("renders warning details when a successful command emits stderr", async () => {
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
				result={buildResult({
					workflowId: "installer",
					mode: "preview",
					command: ["mo", "installer", "--dry-run"],
					stdout: "preview output",
					stderr: "warning output",
					combinedOutput: "preview output\nwarning output",
					outputState: "captured",
				})}
			/>,
		);

		expect(markup).toContain("emitted stderr output");
		expect(markup).toContain("Standard error");
		expect(markup).toContain("warning output");
	});
});