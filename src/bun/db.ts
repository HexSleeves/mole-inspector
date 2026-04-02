import { Database, type Statement } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import type { MoleCommandResult } from "../shared/mole";

const DEFAULT_DATA_DIRECTORY = join(homedir(), ".macos-system-optimizer");
const DEFAULT_DB_PATH = join(DEFAULT_DATA_DIRECTORY, "data.db");

type SettingRow = { value: string };
type SchemaVersionRow = { version: number };
type WorkflowHistoryRow = {
	workflowId: MoleCommandResult["workflowId"];
	mode: MoleCommandResult["mode"];
	command: string;
	ok: number;
	exitCode: number | null;
	startedAt: string;
	finishedAt: string;
	durationMs: number;
	stdout: string;
	stderr: string;
	combinedOutput: string;
	outputState: MoleCommandResult["outputState"];
	error: string | null;
};
type InsertWorkflowParams = [
	workflowId: MoleCommandResult["workflowId"],
	mode: MoleCommandResult["mode"],
	command: string,
	ok: number,
	exitCode: number | null,
	startedAt: string,
	finishedAt: string,
	durationMs: number,
	stdout: string,
	stderr: string,
	combinedOutput: string,
	outputState: MoleCommandResult["outputState"],
	error: string | null,
];

const MIGRATIONS: ReadonlyArray<(db: Database) => void> = [
	(db) => {
		db.run(`
			CREATE TABLE IF NOT EXISTS user_settings (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL,
				updated_at TEXT NOT NULL DEFAULT (datetime('now'))
			);
		`);

		db.run(`
			CREATE TABLE IF NOT EXISTS workflow_history (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				workflow_id TEXT NOT NULL,
				mode TEXT NOT NULL,
				command TEXT NOT NULL,
				ok INTEGER NOT NULL,
				exit_code INTEGER,
				started_at TEXT NOT NULL,
				finished_at TEXT NOT NULL,
				duration_ms INTEGER NOT NULL,
				stdout TEXT NOT NULL DEFAULT '',
				stderr TEXT NOT NULL DEFAULT '',
				combined_output TEXT NOT NULL DEFAULT '',
				output_state TEXT NOT NULL,
				error TEXT,
				created_at TEXT NOT NULL DEFAULT (datetime('now'))
			);
		`);
	},
];

const WORKFLOW_RESULT_COLUMNS = `
	SELECT
		workflow_id AS workflowId,
		mode,
		command,
		ok,
		exit_code AS exitCode,
		started_at AS startedAt,
		finished_at AS finishedAt,
		duration_ms AS durationMs,
		stdout,
		stderr,
		combined_output AS combinedOutput,
		output_state AS outputState,
		error
	FROM workflow_history
`;

export class AppDatabase {
	readonly connection: Database;

	private readonly getSettingStatement: Statement<SettingRow, [string]>;
	private readonly setSettingStatement: Statement<unknown, [string, string]>;
	private readonly insertWorkflowResultStatement: Statement<
		unknown,
		InsertWorkflowParams
	>;
	private readonly workflowHistoryStatement: Statement<WorkflowHistoryRow, [number]>;
	private readonly latestWorkflowResultStatement: Statement<WorkflowHistoryRow, []>;

	constructor(connection: Database) {
		this.connection = connection;
		runMigrations(connection);

		this.getSettingStatement = connection.prepare(
			"SELECT value FROM user_settings WHERE key = ?",
		);
		this.setSettingStatement = connection.prepare(`
			INSERT INTO user_settings (key, value, updated_at)
			VALUES (?, ?, datetime('now'))
			ON CONFLICT(key) DO UPDATE SET
				value = excluded.value,
				updated_at = datetime('now')
		`);
		this.insertWorkflowResultStatement = connection.prepare(`
			INSERT INTO workflow_history (
				workflow_id,
				mode,
				command,
				ok,
				exit_code,
				started_at,
				finished_at,
				duration_ms,
				stdout,
				stderr,
				combined_output,
				output_state,
				error
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
		this.workflowHistoryStatement = connection.prepare(
			`${WORKFLOW_RESULT_COLUMNS} ORDER BY id DESC LIMIT ?`,
		);
		this.latestWorkflowResultStatement = connection.prepare(
			`${WORKFLOW_RESULT_COLUMNS} ORDER BY id DESC LIMIT 1`,
		);
	}

	close(force = false): void {
		this.latestWorkflowResultStatement.finalize();
		this.workflowHistoryStatement.finalize();
		this.insertWorkflowResultStatement.finalize();
		this.setSettingStatement.finalize();
		this.getSettingStatement.finalize();
		this.connection.close(force);
	}

	getSetting(key: string): string | null {
		return this.getSettingStatement.get(key)?.value ?? null;
	}

	setSetting(key: string, value: string): void {
		this.setSettingStatement.run(key, value);
	}

	insertWorkflowResult(result: MoleCommandResult): number {
		const inserted = this.insertWorkflowResultStatement.run(
			result.workflowId,
			result.mode,
			JSON.stringify(result.command),
			result.ok ? 1 : 0,
			result.exitCode,
			result.startedAt,
			result.finishedAt,
			result.durationMs,
			result.stdout,
			result.stderr,
			result.combinedOutput,
			result.outputState,
			result.error,
		);

		return Number(inserted.lastInsertRowid);
	}

	getWorkflowHistory(limit = 20): MoleCommandResult[] {
		return this.workflowHistoryStatement
			.all(limit)
			.map(deserializeWorkflowHistoryRow);
	}

	getLatestWorkflowResult(): MoleCommandResult | null {
		const row = this.latestWorkflowResultStatement.get();
		return row ? deserializeWorkflowHistoryRow(row) : null;
	}
}

let singletonDatabase: AppDatabase | null = null;

export function openDatabase(dbPath = DEFAULT_DB_PATH): AppDatabase {
	ensureDatabaseDirectory(dbPath);
	return new AppDatabase(
		new Database(dbPath, {
			create: true,
			readwrite: true,
			strict: true,
		}),
	);
}

export function getDb(): AppDatabase {
	if (!singletonDatabase) {
		singletonDatabase = openDatabase();
	}

	return singletonDatabase;
}

export function closeDb(): void {
	if (singletonDatabase) {
		singletonDatabase.close();
		singletonDatabase = null;
	}
}

export function getSetting(key: string): string | null {
	return getDb().getSetting(key);
}

export function setSetting(key: string, value: string): void {
	getDb().setSetting(key, value);
}

export function insertWorkflowResult(result: MoleCommandResult): number {
	return getDb().insertWorkflowResult(result);
}

export function getWorkflowHistory(limit = 20): MoleCommandResult[] {
	return getDb().getWorkflowHistory(limit);
}

export function getLatestWorkflowResult(): MoleCommandResult | null {
	return getDb().getLatestWorkflowResult();
}

function ensureDatabaseDirectory(dbPath: string): void {
	if (dbPath === "" || dbPath === ":memory:") {
		return;
	}

	const directory = dirname(dbPath);
	if (!existsSync(directory)) {
		mkdirSync(directory, { recursive: true });
	}
}

function runMigrations(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS schema_version (
			version INTEGER PRIMARY KEY
		);
	`);

	const currentVersion =
		db.query<SchemaVersionRow, []>(
			"SELECT version FROM schema_version ORDER BY version DESC LIMIT 1",
		).get()?.version ?? 0;

	for (let version = currentVersion + 1; version <= MIGRATIONS.length; version += 1) {
		db.run("BEGIN");

		try {
			MIGRATIONS[version - 1](db);
			db.run("INSERT INTO schema_version (version) VALUES (?)", [version]);
			db.run("COMMIT");
		} catch (error) {
			if (db.inTransaction) {
				db.run("ROLLBACK");
			}
			throw error;
		}
	}
}

function deserializeWorkflowHistoryRow(
	row: WorkflowHistoryRow,
): MoleCommandResult {
	return {
		workflowId: row.workflowId,
		mode: row.mode,
		command: parseCommand(row.command),
		ok: row.ok === 1,
		exitCode: row.exitCode,
		startedAt: row.startedAt,
		finishedAt: row.finishedAt,
		durationMs: row.durationMs,
		stdout: row.stdout,
		stderr: row.stderr,
		combinedOutput: row.combinedOutput,
		outputState: row.outputState,
		error: row.error,
	};
}

function parseCommand(serializedCommand: string): string[] {
	const parsed = JSON.parse(serializedCommand) as unknown;
	if (
		!Array.isArray(parsed) ||
		parsed.some((part) => typeof part !== "string")
	) {
		throw new Error("Stored workflow command is not a valid string array.");
	}

	return parsed;
}