import { describe, expect, it } from "bun:test";

import config from "./vite.config";

describe("vite config", () => {
	it("uses relative asset paths for views:// packaging", () => {
		expect(config.base).toBe("./");
	});
});
