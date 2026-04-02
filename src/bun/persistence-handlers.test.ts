import { describe, expect, test } from "bun:test";

import type { MoleCommandResult } from "../shared/mole";
import {
	createPersistenceHandlers,
} from "./persistence-handlers";
import {
	DEFAULT_PROCESS_LIMIT,
	MONITORING_POLL_INTERVAL_MS,
} from "../shared/monitoring";

describe("createPersistenceHandlers", () => {
	test("getUserSettings returns defaults when settings are missing", () => {
		const handlers = createPersistenceHandlers({
			readSetting: () => null,
			writeSetting: () => {},
			readWorkflowHistory: () => [],
			clearWorkflowHistory: () => {},
		});

		expect(handlers.getUserSettings()).toEqual({
			processLimit: DEFAULT_PROCESS_LIMIT,
			refreshIntervalMs: MONITORING_POLL_INTERVAL_MS,
			liveUpdatesEnabled: true,
		});
	});

	test("getUserSettings maps persisted string values", () => {
		const settings = new Map<string, string>([
			["processLimit", "12"],
			["refreshIntervalMs", "9000"],
			["liveUpdatesEnabled", "false"],
		]);
		const handlers = createPersistenceHandlers({
			readSetting: (key) => settings.get(key) ?? null,
			writeSetting: () => {},
			readWorkflowHistory: () => [],
			clearWorkflowHistory: () => {},
		});

		expect(handlers.getUserSettings()).toEqual({
			processLimit: 12,
			refreshIntervalMs: 9000,
			liveUpdatesEnabled: false,
		});
	});

	test("getUserSettings preserves persisted zero values", () => {
		const settings = new Map<string, string>([
			["processLimit", "0"],
			["refreshIntervalMs", "0"],
		]);
		const handlers = createPersistenceHandlers({
			readSetting: (key) => settings.get(key) ?? null,
			writeSetting: () => {},
			readWorkflowHistory: () => [],
			clearWorkflowHistory: () => {},
		});

		expect(handlers.getUserSettings()).toEqual({
			processLimit: 0,
			refreshIntervalMs: 0,
			liveUpdatesEnabled: true,
		});
	});

	test("getUserSettings falls back for invalid numeric values", () => {
		const settings = new Map<string, string>([
			["processLimit", "not-a-number"],
			["refreshIntervalMs", "NaN"],
		]);
		const handlers = createPersistenceHandlers({
			readSetting: (key) => settings.get(key) ?? null,
			writeSetting: () => {},
			readWorkflowHistory: () => [],
			clearWorkflowHistory: () => {},
		});

		expect(handlers.getUserSettings()).toEqual({
			processLimit: DEFAULT_PROCESS_LIMIT,
			refreshIntervalMs: MONITORING_POLL_INTERVAL_MS,
			liveUpdatesEnabled: true,
		});
	});

	test("updateUserSetting writes the provided key and value", () => {
		const writes: Array<{ key: string; value: string }> = [];
		const handlers = createPersistenceHandlers({
			readSetting: () => null,
			writeSetting: (key, value) => {
				writes.push({ key, value });
			},
			readWorkflowHistory: () => [],
			clearWorkflowHistory: () => {},
		});

		expect(
			handlers.updateUserSetting({
				key: "processLimit",
				value: "16",
			}),
		).toEqual({ ok: true });
		expect(writes).toEqual([{ key: "processLimit", value: "16" }]);
	});

	test("getWorkflowHistory forwards the requested limit", () => {
		const history: MoleCommandResult[] = [
			{
				workflowId: "clean",
				mode: "preview",
				command: ["mo", "clean", "--dry-run"],
				ok: true,
				exitCode: 0,
				startedAt: "2026-04-02T00:00:00.000Z",
				finishedAt: "2026-04-02T00:00:01.000Z",
				durationMs: 1000,
				stdout: "ok",
				stderr: "",
				combinedOutput: "ok",
				outputState: "captured",
				error: null,
			},
		];
		const receivedLimits: Array<number | undefined> = [];
		const handlers = createPersistenceHandlers({
			readSetting: () => null,
			writeSetting: () => {},
			readWorkflowHistory: (limit) => {
				receivedLimits.push(limit);
				return history;
			},
			clearWorkflowHistory: () => {},
		});

		expect(handlers.getWorkflowHistory({ limit: 5 })).toEqual(history);
		expect(receivedLimits).toEqual([5]);
	});

	test("clearWorkflowHistory clears persisted rows", () => {
		let cleared = false;
		const handlers = createPersistenceHandlers({
			readSetting: () => null,
			writeSetting: () => {},
			readWorkflowHistory: () => [],
			clearWorkflowHistory: () => {
				cleared = true;
			},
		});

		expect(handlers.clearWorkflowHistory()).toEqual({ ok: true });
		expect(cleared).toBe(true);
	});
});
