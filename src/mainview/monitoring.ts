import { Electroview } from "electrobun/view";
import type {
	MoleCommandResult,
	MoleStatusSnapshot,
	MoleWorkflowRequest,
} from "../shared/mole";
import type {
	UpdateSettingRequest,
	UserSettings,
	WorkflowHistoryRequest,
} from "../shared/persistence";
import type {
	MonitoringRequest,
	MonitoringRpcSchema,
	MonitoringSnapshot,
} from "../shared/monitoring";

declare global {
	interface Window {
		__monitoringFoundationBridge?: {
			getMonitoringSnapshot: (
				request?: MonitoringRequest,
			) => Promise<MonitoringSnapshot>;
			getMoleStatus: () => Promise<MoleStatusSnapshot>;
			runMoleWorkflow: (
				request: MoleWorkflowRequest,
			) => Promise<MoleCommandResult>;
			getUserSettings: () => Promise<UserSettings>;
			updateUserSetting: (
				request: UpdateSettingRequest,
			) => Promise<{ ok: boolean }>;
			getWorkflowHistory: (
				request: WorkflowHistoryRequest,
			) => Promise<MoleCommandResult[]>;
			clearWorkflowHistory: () => Promise<{ ok: boolean }>;
		};
	}
}

export const monitoringBridge =
	window.__monitoringFoundationBridge ?? createMonitoringBridge();

window.__monitoringFoundationBridge = monitoringBridge;

function createMonitoringBridge() {
	const rpc = Electroview.defineRPC<MonitoringRpcSchema>({
		handlers: {
			requests: {},
			messages: {},
		},
		maxRequestTime: 15_000,
	});

	new Electroview({ rpc });

	return {
		getMonitoringSnapshot: (request: MonitoringRequest = {}) =>
			rpc.requestProxy.getMonitoringSnapshot(request),
		getMoleStatus: () => rpc.requestProxy.getMoleStatus({}),
		runMoleWorkflow: (request: MoleWorkflowRequest) =>
			rpc.requestProxy.runMoleWorkflow(request),
		getUserSettings: () => rpc.requestProxy.getUserSettings({}),
		updateUserSetting: (request: UpdateSettingRequest) =>
			rpc.requestProxy.updateUserSetting(request),
		getWorkflowHistory: (request: WorkflowHistoryRequest) =>
			rpc.requestProxy.getWorkflowHistory(request),
		clearWorkflowHistory: () => rpc.requestProxy.clearWorkflowHistory({}),
	};
}
