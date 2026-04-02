import { describe, expect, test } from "bun:test";

import type { MoleCommandResult } from "../../shared/mole";
import { getWorkflowToastOptions } from "./use-workflow-toast";

function buildResult(overrides: Partial<MoleCommandResult>): MoleCommandResult {
	return {
		workflowId: "optimize",
		mode: "apply",
		command: ["mo", "optimize"],
		ok: true,
		exitCode: 0,
		startedAt: "2026-04-02T00:00:00.000Z",
		finishedAt: "2026-04-02T00:00:01.000Z",
		durationMs: 1_000,
		stdout: "",
		stderr: "",
		combinedOutput: "",
		outputState: "empty",
		error: null,
		...overrides,
	};
}

describe("getWorkflowToastOptions", () => {
	test("builds a success toast for completed workflows", () => {
		expect(getWorkflowToastOptions(buildResult({}))).toEqual({
			title: "Optimize system health",
			description: "completed successfully",
			variant: "success",
		});
	});

	test("builds an error toast with the workflow error message", () => {
		expect(
			getWorkflowToastOptions(
				buildResult({
					ok: false,
					error: "Command exited with code 1.",
					exitCode: 1,
					outputState: "captured",
					combinedOutput: "Command exited with code 1.",
				}),
			),
		).toEqual({
			title: "Optimize system health",
			description: "Command exited with code 1.",
			variant: "error",
		});
	});
});