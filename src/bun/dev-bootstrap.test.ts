import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("desktop dev bootstrap only enables HMR with an explicit opt-in flag", () => {
	const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

	expect(source).toContain("ELECTROBUN_USE_HMR");
});

test("desktop RPC timeout stays aligned with the Mole command timeout", () => {
	const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

	expect(source).toContain(
		'import { MOLE_COMMAND_TIMEOUT_MS } from "../shared/mole"',
	);
	expect(source).toContain("maxRequestTime: MOLE_COMMAND_TIMEOUT_MS + 10_000");
});

test("desktop runtime exits when the last window closes", () => {
	const source = readFileSync(
		new URL("../../electrobun.config.ts", import.meta.url),
		"utf8",
	);

	expect(source).toContain("runtime:");
	expect(source).toContain("exitOnLastWindowClosed: true");
});

test("desktop main process closes the SQLite connection before quitting", () => {
	const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

	expect(source).toContain("import Electrobun");
	expect(source).toContain('from "electrobun/bun"');
	expect(source).toContain('import { closeDb } from "./db"');
	expect(source).toContain('Electrobun.events.on("before-quit", async () => {');
	expect(source).toContain("closeDb();");
});

test("database module exports a closeDb helper for the singleton connection", () => {
	const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

	expect(source).toContain("export function closeDb(): void {");
	expect(source).toContain("singletonDatabase.close();");
	expect(source).toContain("singletonDatabase = null;");
});
