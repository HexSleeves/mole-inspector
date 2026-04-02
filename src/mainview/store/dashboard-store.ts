import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { create } from "zustand";

import { monitoringBridge } from "../monitoring";
import type { UserSettings } from "../../shared/persistence";
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
	hydrateFromSaved: (saved: Partial<UserSettings>) => void;
	setProcessLimit: (limit: number) => void;
	setRefreshIntervalMs: (intervalMs: number) => void;
	toggleLiveUpdates: () => void;
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
	processLimit: DEFAULT_PROCESS_LIMIT,
	refreshIntervalMs: MONITORING_POLL_INTERVAL_MS,
	liveUpdatesEnabled: true,
	hydrateFromSaved: (saved) =>
		set({
			...(saved.processLimit != null && { processLimit: saved.processLimit }),
			...(saved.refreshIntervalMs != null && {
				refreshIntervalMs: saved.refreshIntervalMs,
			}),
			...(saved.liveUpdatesEnabled != null && {
				liveUpdatesEnabled: saved.liveUpdatesEnabled,
			}),
		}),
	setProcessLimit: (limit) => {
		set({ processLimit: limit });
		monitoringBridge
			.updateUserSetting({ key: "processLimit", value: String(limit) })
			.catch(() => {});
	},
	setRefreshIntervalMs: (intervalMs) => {
		set({ refreshIntervalMs: intervalMs });
		monitoringBridge
			.updateUserSetting({
				key: "refreshIntervalMs",
				value: String(intervalMs),
			})
			.catch(() => {});
	},
	toggleLiveUpdates: () => {
		const nextValue = !get().liveUpdatesEnabled;
		set({ liveUpdatesEnabled: nextValue });
		monitoringBridge
			.updateUserSetting({
				key: "liveUpdatesEnabled",
				value: String(nextValue),
			})
			.catch(() => {});
	},
}));

export function useHydrateSettings() {
	const hydrateFromSaved = useDashboardStore((state) => state.hydrateFromSaved);
	const query = useQuery({
		queryKey: ["user-settings"],
		queryFn: () => monitoringBridge.getUserSettings(),
		staleTime: Infinity,
		retry: 1,
	});

	useEffect(() => {
		if (query.data) {
			hydrateFromSaved(query.data);
		}
	}, [query.data, hydrateFromSaved]);
}
