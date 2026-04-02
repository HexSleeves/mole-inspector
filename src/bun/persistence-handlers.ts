import {
	clearAllWorkflowHistory,
	getSetting,
	getWorkflowHistory as dbGetWorkflowHistory,
	setSetting,
} from "./db";
import type { MoleCommandResult } from "../shared/mole";
import type {
	UpdateSettingRequest,
	UserSettings,
	WorkflowHistoryRequest,
} from "../shared/persistence";
import {
	DEFAULT_PROCESS_LIMIT,
	MONITORING_POLL_INTERVAL_MS,
} from "../shared/monitoring";

type PersistenceHandlerDependencies = {
	readSetting: (key: string) => string | null;
	writeSetting: (key: string, value: string) => void;
	readWorkflowHistory: (limit?: number) => MoleCommandResult[];
	clearWorkflowHistory: () => void;
};

export function createPersistenceHandlers(
	dependencies: PersistenceHandlerDependencies = {
		readSetting: getSetting,
		writeSetting: setSetting,
		readWorkflowHistory: dbGetWorkflowHistory,
		clearWorkflowHistory: clearAllWorkflowHistory,
	},
) {
	return {
		getUserSettings(): UserSettings {
			return {
				processLimit: parseNumericSetting(
					dependencies.readSetting("processLimit"),
					DEFAULT_PROCESS_LIMIT,
				),
				refreshIntervalMs: parseNumericSetting(
					dependencies.readSetting("refreshIntervalMs"),
					MONITORING_POLL_INTERVAL_MS,
				),
				liveUpdatesEnabled:
					dependencies.readSetting("liveUpdatesEnabled") !== "false",
			};
		},

		updateUserSetting(request: UpdateSettingRequest): { ok: boolean } {
			dependencies.writeSetting(request.key, request.value);
			return { ok: true };
		},

		getWorkflowHistory(
			request: WorkflowHistoryRequest,
		): MoleCommandResult[] {
			return dependencies.readWorkflowHistory(request.limit);
		},

		clearWorkflowHistory(): { ok: boolean } {
			dependencies.clearWorkflowHistory();
			return { ok: true };
		},
	};
}

export const {
	getUserSettings,
	updateUserSetting,
	getWorkflowHistory,
	clearWorkflowHistory,
} = createPersistenceHandlers();

function parseNumericSetting(value: string | null, fallback: number): number {
	if (value === null) {
		return fallback;
	}

	const parsed = Number(value);
	return Number.isNaN(parsed) ? fallback : parsed;
}
