export interface UserSettings {
	processLimit: number;
	refreshIntervalMs: number;
	liveUpdatesEnabled: boolean;
}

export interface UpdateSettingRequest {
	key: keyof UserSettings;
	value: string;
}

export interface WorkflowHistoryRequest {
	limit?: number;
}
