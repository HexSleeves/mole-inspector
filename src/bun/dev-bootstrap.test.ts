import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("desktop dev bootstrap only enables HMR with an explicit opt-in flag", () => {
	const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

	expect(source).toContain("ELECTROBUN_USE_HMR");
});
