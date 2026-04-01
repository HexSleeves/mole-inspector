import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("vite config uses relative asset paths for packaged views", () => {
	const source = readFileSync(
		new URL("../../vite.config.ts", import.meta.url),
		"utf8",
	);

	expect(source).toContain('base: "./"');
});
