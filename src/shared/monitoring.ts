import type {
	MoleCommandResult,
	MoleStatusSnapshot,
	MoleWorkflowRequest,
} from "./mole";

export const DEFAULT_PROCESS_LIMIT = 8;
export const MONITORING_POLL_INTERVAL_MS = 3_000;

export interface MonitoringRequest {
	processLimit?: number;
}

export type MetricResult<T> =
	| { status: "ok"; data: T }
	| { status: "error"; message: string };

export interface CpuSnapshot {
	overallLoadPercent: number;
	userLoadPercent: number;
	systemLoadPercent: number;
	averageLoad: number;
	perCoreLoadPercent: number[];
}

export interface MemorySnapshot {
	totalBytes: number;
	usedBytes: number;
	freeBytes: number;
	availableBytes: number;
	activeBytes: number;
	swapTotalBytes: number;
	swapUsedBytes: number;
	utilizationPercent: number;
	swapUtilizationPercent: number;
}

export interface DiskVolumeSnapshot {
	name: string;
	type: string;
	mount: string;
	sizeBytes: number;
	usedBytes: number;
	availableBytes: number;
	utilizationPercent: number;
	isReadWrite: boolean;
}

export interface DiskIoSnapshot {
	readOperations: number;
	writeOperations: number;
	totalOperations: number;
	readOpsPerSecond: number | null;
	writeOpsPerSecond: number | null;
	totalOpsPerSecond: number | null;
	sampleMs: number;
}

export interface DiskSnapshot {
	volumes: DiskVolumeSnapshot[];
	io: DiskIoSnapshot;
}

export interface ProcessSnapshot {
	pid: number;
	parentPid: number;
	name: string;
	cpuPercent: number;
	memoryPercent: number;
	memoryBytes: number;
	state: string;
	startedAt: string;
	user: string;
}

export interface ProcessCollectionSnapshot {
	total: number;
	running: number;
	blocked: number;
	sleeping: number;
	list: ProcessSnapshot[];
}

export interface NetworkInterfaceSnapshot {
	name: string;
	displayName: string;
	isDefault: boolean;
	ipv4: string;
	ipv6: string;
	macAddress: string;
	state: string;
	receivedBytes: number;
	transmittedBytes: number;
	receivedBytesPerSecond: number | null;
	transmittedBytesPerSecond: number | null;
	sampleMs: number;
}

export interface NetworkSnapshot {
	interfaces: NetworkInterfaceSnapshot[];
}

export interface MonitoringSnapshot {
	collectedAt: string;
	cpu: MetricResult<CpuSnapshot>;
	memory: MetricResult<MemorySnapshot>;
	disk: MetricResult<DiskSnapshot>;
	processes: MetricResult<ProcessCollectionSnapshot>;
	network: MetricResult<NetworkSnapshot>;
}

export type MonitoringRpcSchema = {
	bun: {
		requests: {
			getMonitoringSnapshot: {
				params: MonitoringRequest;
				response: MonitoringSnapshot;
			};
			getMoleStatus: {
				params: Record<string, never>;
				response: MoleStatusSnapshot;
			};
			runMoleWorkflow: {
				params: MoleWorkflowRequest;
				response: MoleCommandResult;
			};
		};
		messages: Record<string, never>;
	};
	webview: {
		requests: Record<string, never>;
		messages: Record<string, never>;
	};
};

export function isMetricOk<T>(metric: MetricResult<T>): metric is {
	status: "ok";
	data: T;
} {
	return metric.status === "ok";
}
