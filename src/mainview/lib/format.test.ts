import { describe, expect, test } from "bun:test";

import { formatTime } from "./format";

describe("formatTime", () => {
	test("returns an em dash for invalid dates", () => {
		expect(formatTime("not-a-date")).toBe("—");
	});

	test("formats valid dates as local time strings", () => {
		expect(formatTime("2026-04-02T10:15:30.000Z")).not.toBe("—");
	});
});