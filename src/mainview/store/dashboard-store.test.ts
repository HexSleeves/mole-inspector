import { afterEach, beforeAll, describe, expect, test } from "bun:test";

import {
	DEFAULT_PROCESS_LIMIT,
	MONITORING_POLL_INTERVAL_MS,
} from "../../shared/monitoring";

const updateCalls: Array<{ key: string; value: string }> = [];

const bridge = {
	getMonitoringSnapshot: async () => {
		throw new Error("not used in this test");
	},
	getMoleStatus: async () => {
		throw new Error("not used in this test");
	},
	runMoleWorkflow: async () => {
		throw new Error("not used in this test");
	},
	getUserSettings: async () => ({
		processLimit: DEFAULT_PROCESS_LIMIT,
		refreshIntervalMs: MONITORING_POLL_INTERVAL_MS,
		liveUpdatesEnabled: true,
	}),
	updateUserSetting: async (request: { key: string; value: string }) => {
		updateCalls.push(request);
		return { ok: true };
	},
	getWorkflowHistory: async () => [],
	clearWorkflowHistory: async () => ({ ok: true }),
};

type DashboardStoreModule = typeof import("./dashboard-store");
type MonitoringModule = typeof import("../monitoring");

let storeModule: DashboardStoreModule;
let monitoringModule: MonitoringModule;

beforeAll(async () => {
	(globalThis as { window?: unknown }).window = {
		__monitoringFoundationBridge: bridge,
	};
	monitoringModule = await import("../monitoring");
	Object.assign(monitoringModule.monitoringBridge, bridge);
	storeModule = await import("./dashboard-store");
});

afterEach(() => {
	updateCalls.length = 0;
	storeModule.useDashboardStore.setState({
		processLimit: DEFAULT_PROCESS_LIMIT,
		refreshIntervalMs: MONITORING_POLL_INTERVAL_MS,
		liveUpdatesEnabled: true,
	});
});

describe("dashboard store", () => {
	test("hydrates partial persisted settings without overwriting defaults", () => {
		storeModule.useDashboardStore
			.getState()
			.hydrateFromSaved({ processLimit: 12, liveUpdatesEnabled: false });

		expect(storeModule.useDashboardStore.getState()).toMatchObject({
			processLimit: 12,
			refreshIntervalMs: MONITORING_POLL_INTERVAL_MS,
			liveUpdatesEnabled: false,
		});
	});

	test("persists settings changes through the monitoring bridge", () => {
		const state = storeModule.useDashboardStore.getState();

		state.setProcessLimit(12);
		state.setRefreshIntervalMs(5_000);
		state.toggleLiveUpdates();

		expect(storeModule.useDashboardStore.getState()).toMatchObject({
			processLimit: 12,
			refreshIntervalMs: 5_000,
			liveUpdatesEnabled: false,
		});
		expect(updateCalls).toEqual([
			{ key: "processLimit", value: "12" },
			{ key: "refreshIntervalMs", value: "5000" },
			{ key: "liveUpdatesEnabled", value: "false" },
		]);
	});
});