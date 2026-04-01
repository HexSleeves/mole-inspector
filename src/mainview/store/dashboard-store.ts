import { create } from "zustand";

import {
	DEFAULT_PROCESS_LIMIT,
	MONITORING_POLL_INTERVAL_MS,
} from "../../shared/monitoring";

export const PROCESS_LIMIT_OPTIONS = [5, DEFAULT_PROCESS_LIMIT, 12] as const;
export const REFRESH_INTERVAL_OPTIONS = [
	2_000,
	MONITORING_POLL_INTERVAL_MS,
	5_000,
	10_000,
] as const;

type DashboardStore = {
	processLimit: number;
	refreshIntervalMs: number;
	liveUpdatesEnabled: boolean;
	setProcessLimit: (limit: number) => void;
	setRefreshIntervalMs: (intervalMs: number) => void;
	toggleLiveUpdates: () => void;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
	processLimit: DEFAULT_PROCESS_LIMIT,
	refreshIntervalMs: MONITORING_POLL_INTERVAL_MS,
	liveUpdatesEnabled: true,
	setProcessLimit: (limit) => set({ processLimit: limit }),
	setRefreshIntervalMs: (intervalMs) => set({ refreshIntervalMs: intervalMs }),
	toggleLiveUpdates: () =>
		set((state) => ({ liveUpdatesEnabled: !state.liveUpdatesEnabled })),
}));
