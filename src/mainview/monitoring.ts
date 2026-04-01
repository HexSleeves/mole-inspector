import { Electroview } from "electrobun/view";

import type {
	MonitoringRequest,
	MonitoringRpcSchema,
	MonitoringSnapshot,
} from "../shared/monitoring";
import type {
	MoleCommandResult,
	MoleStatusSnapshot,
	MoleWorkflowRequest,
} from "../shared/mole";

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
	};
}
