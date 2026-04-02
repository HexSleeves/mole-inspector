import { afterEach, describe, expect, test } from "bun:test";

import type { MoleCommandResult } from "../shared/mole";
import { openDatabase, type AppDatabase } from "./db";

const openDatabases = new Set<AppDatabase>();

afterEach(() => {
	for (const database of openDatabases) {
		database.close(true);
	}
	openDatabases.clear();
});

describe("AppDatabase", () => {
	test("schema migration creates the required tables", () => {
		const db = createTestDatabase();

		const tables = db.connection
			.query<{ name: string }, []>(
				`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('schema_version', 'user_settings', 'workflow_history') ORDER BY name`,
			)
			.all()
			.map((row) => row.name);
		const version = db.connection
			.query<{ version: number }, []>(
				"SELECT version FROM schema_version ORDER BY version DESC LIMIT 1",
			)
			.get()?.version;

		expect(tables).toEqual([
			"schema_version",
			"user_settings",
			"workflow_history",
		]);
		expect(version).toBe(1);
	});

	test("getSetting and setSetting round-trip values", () => {
		const db = createTestDatabase();

		expect(db.getSetting("refreshIntervalMs")).toBeNull();

		db.setSetting("refreshIntervalMs", "15000");

		expect(db.getSetting("refreshIntervalMs")).toBe("15000");
	});

	test("setSetting overwrites existing values", () => {
		const db = createTestDatabase();

		db.setSetting("theme", "dark");
		db.setSetting("theme", "system");

		expect(db.getSetting("theme")).toBe("system");
	});

	test("insertWorkflowResult stores rows and getWorkflowHistory retrieves them", () => {
		const db = createTestDatabase();
		const result = buildResult({
			workflowId: "optimize",
			mode: "apply",
			command: ["mo", "optimize"],
			ok: false,
			exitCode: 2,
			stdout: "",
			stderr: "permission denied",
			combinedOutput: "permission denied",
			error: "permission denied",
		});

		const rowId = db.insertWorkflowResult(result);

		expect(rowId).toBe(1);
		expect(db.getWorkflowHistory()).toEqual([result]);
	});

	test("getWorkflowHistory respects the limit parameter", () => {
		const db = createTestDatabase();

		db.insertWorkflowResult(buildResult({ workflowId: "clean" }));
		db.insertWorkflowResult(buildResult({ workflowId: "optimize" }));
		db.insertWorkflowResult(buildResult({ workflowId: "installer" }));

		expect(db.getWorkflowHistory(2).map((result) => result.workflowId)).toEqual([
			"installer",
			"optimize",
		]);
	});

	test("getWorkflowHistory returns newest results first", () => {
		const db = createTestDatabase();
		const first = buildResult({
			workflowId: "clean",
			startedAt: "2026-04-02T00:00:00.000Z",
			finishedAt: "2026-04-02T00:00:01.000Z",
		});
		const second = buildResult({
			workflowId: "purge",
			startedAt: "2026-04-02T00:00:02.000Z",
			finishedAt: "2026-04-02T00:00:03.000Z",
		});

		db.insertWorkflowResult(first);
		db.insertWorkflowResult(second);

		expect(db.getWorkflowHistory()).toEqual([second, first]);
	});

	test("getLatestWorkflowResult returns null when empty", () => {
		const db = createTestDatabase();

		expect(db.getLatestWorkflowResult()).toBeNull();
	});

	test("getLatestWorkflowResult returns the most recent entry", () => {
		const db = createTestDatabase();
		const older = buildResult({ workflowId: "clean" });
		const newer = buildResult({ workflowId: "optimize", mode: "apply" });

		db.insertWorkflowResult(older);
		db.insertWorkflowResult(newer);

		expect(db.getLatestWorkflowResult()).toEqual(newer);
	});
});

function createTestDatabase(): AppDatabase {
	const db = openDatabase(":memory:");
	openDatabases.add(db);
	return db;
}

function buildResult(
	overrides: Partial<MoleCommandResult> = {},
): MoleCommandResult {
	return {
		workflowId: "clean",
		mode: "preview",
		command: ["mo", "clean", "--dry-run"],
		ok: true,
		exitCode: 0,
		startedAt: "2026-04-02T00:00:00.000Z",
		finishedAt: "2026-04-02T00:00:01.000Z",
		durationMs: 1_000,
		stdout: "preview ok",
		stderr: "",
		combinedOutput: "preview ok",
		outputState: "captured",
		error: null,
		...overrides,
	};
}