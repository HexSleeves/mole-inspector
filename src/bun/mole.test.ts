import { describe, expect, test } from "bun:test";

import {
	getMoleStatusWith,
	parseMoleStatusSummary,
	runMoleWorkflowWith,
	runMoleWorkflowWithPersistence,
} from "./mole";

describe("parseMoleStatusSummary", () => {
	test("extracts the status fields needed by the renderer", () => {
		const summary = parseMoleStatusSummary(
			JSON.stringify({
				host: "example.local",
				platform: "darwin 26.4",
				uptime: "3d 6h",
				health_score: 94,
				health_score_msg: "Excellent",
				hardware: {
					model: "MacBook Pro",
					total_ram: "64.0 GB",
					disk_size: "1.8 TB",
					os_version: "macOS 26.4",
				},
			}),
		);

		expect(summary).toEqual({
			healthScore: 94,
			healthLabel: "Excellent",
			host: "example.local",
			platform: "darwin 26.4",
			uptime: "3d 6h",
			model: "MacBook Pro",
			totalRam: "64.0 GB",
			diskSize: "1.8 TB",
			osVersion: "macOS 26.4",
		});
	});

	test("returns null for invalid json", () => {
		expect(parseMoleStatusSummary("not-json")).toBeNull();
	});
});

test("getMoleStatusWith reports a missing installation without throwing", async () => {
	const status = await getMoleStatusWith({
		which: () => null,
		spawn: () => {
			throw new Error("spawn should not be called when Mole is missing");
		},
		now: () => new Date("2026-03-30T23:10:00.000Z"),
		timeoutMs: 5_000,
	});

	expect(status.availability.isInstalled).toBe(false);
	expect(status.summary).toBeNull();
	expect(status.error).toBeNull();
	expect(status.availability.installCommand).toBe("brew install mole");
});

test("runMoleWorkflowWith uses the dry-run command for preview mode", async () => {
	let command: string[] = [];

	const result = await runMoleWorkflowWith(
		{
			workflowId: "clean",
			mode: "preview",
		},
		{
			which: () => "/opt/homebrew/bin/mo",
			spawn: (cmd) => {
				command = cmd;
				return {
					exited: Promise.resolve(0),
					stdout: textStream("preview ok\n"),
					stderr: textStream(""),
					kill: () => {},
				};
			},
			now: fixedClock(),
			timeoutMs: 5_000,
		},
	);

	expect(command).toEqual(["mo", "clean", "--dry-run"]);
	expect(result.ok).toBe(true);
	expect(result.combinedOutput).toBe("preview ok");
});

test("runMoleWorkflowWithPersistence stores the computed workflow result", async () => {
	let persistedResultJson: string | null = null;

	const result = await runMoleWorkflowWithPersistence(
		{
			workflowId: "clean",
			mode: "preview",
		},
		{
			which: () => "/opt/homebrew/bin/mo",
			spawn: () => ({
				exited: Promise.resolve(0),
				stdout: textStream("saved output\n"),
				stderr: textStream(""),
				kill: () => {},
			}),
			now: fixedClock(),
			timeoutMs: 5_000,
		},
		(value) => {
			persistedResultJson = JSON.stringify(value);
		},
	);

	if (persistedResultJson === null) {
		throw new Error("Expected workflow result to be persisted.");
	}

	if (persistedResultJson !== JSON.stringify(result)) {
		throw new Error("Persisted workflow result did not match the computed result.");
	}
});

test("runMoleWorkflowWith marks successful apply runs with no terminal output", async () => {
	const result = await runMoleWorkflowWith(
		{
			workflowId: "optimize",
			mode: "apply",
		},
		{
			which: () => "/opt/homebrew/bin/mo",
			spawn: () => ({
				exited: Promise.resolve(0),
				stdout: textStream(""),
				stderr: textStream(""),
				kill: () => {},
			}),
			now: fixedClock(),
			timeoutMs: 5_000,
		},
	);

	expect(result.ok).toBe(true);
	expect(result.combinedOutput).toBe("");
	expect(result.outputState).toBe("empty");
});

function fixedClock() {
	let tick = 0;
	return () => new Date(`2026-03-30T23:10:0${tick++}.000Z`);
}

function textStream(value: string): ReadableStream<Uint8Array> {
	return new ReadableStream({
		start(controller) {
			controller.enqueue(new TextEncoder().encode(value));
			controller.close();
		},
	});
}
