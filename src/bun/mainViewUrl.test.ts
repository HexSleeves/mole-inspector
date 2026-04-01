import { describe, expect, test } from "bun:test";

import {
	DEV_SERVER_URL,
	MAIN_VIEW_URL,
	resolveMainViewUrl,
} from "./mainViewUrl";

describe("resolveMainViewUrl", () => {
	test("uses the bundled view when HMR is not explicitly enabled", async () => {
		const url = await resolveMainViewUrl({
			channel: "dev",
			enableHmr: false,
			fetchHtml: async () => ({
				ok: true,
				text: async () =>
					'<meta name="macos-system-optimizer-app" content="mainview" />',
			}),
		});

		expect(url).toBe(MAIN_VIEW_URL);
	});

	test("uses the dev server when HMR is enabled and the page marker matches", async () => {
		const url = await resolveMainViewUrl({
			channel: "dev",
			enableHmr: true,
			fetchHtml: async () => ({
				ok: true,
				text: async () =>
					'<html><head><meta name="macos-system-optimizer-app" content="mainview" /></head></html>',
			}),
		});

		expect(url).toBe(DEV_SERVER_URL);
	});

	test("ignores unrelated servers even when HMR is enabled", async () => {
		const url = await resolveMainViewUrl({
			channel: "dev",
			enableHmr: true,
			fetchHtml: async () => ({
				ok: true,
				text: async () => "<title>Mole Monitor</title>",
			}),
		});

		expect(url).toBe(MAIN_VIEW_URL);
	});
});
