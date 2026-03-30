import { Electroview } from "electrobun/view";

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
	};
}
