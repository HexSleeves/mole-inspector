import * as si from "systeminformation";

import {
	DEFAULT_PROCESS_LIMIT,
	type CpuSnapshot,
	type DiskSnapshot,
	type MemorySnapshot,
	type MetricResult,
	type MonitoringRequest,
	type MonitoringSnapshot,
	type NetworkSnapshot,
	type ProcessCollectionSnapshot,
} from "../shared/monitoring";

const MAX_PROCESS_LIMIT = 25;

export async function getMonitoringSnapshot(
	request: MonitoringRequest = {},
): Promise<MonitoringSnapshot> {
	const processLimit = normalizeProcessLimit(request.processLimit);

	const [cpu, memory, disk, processes, network] = await Promise.all([
		collectMetric("CPU metrics", collectCpu),
		collectMetric("Memory metrics", collectMemory),
		collectMetric("Disk metrics", collectDisk),
		collectMetric("Process metrics", () => collectProcesses(processLimit)),
		collectMetric("Network metrics", collectNetwork),
	]);

	return {
		collectedAt: new Date().toISOString(),
		cpu,
		memory,
		disk,
		processes,
		network,
	};
}

async function collectMetric<T>(
	label: string,
	collector: () => Promise<T>,
): Promise<MetricResult<T>> {
	try {
		return {
			status: "ok",
			data: await collector(),
		};
	} catch (error) {
		console.error(`${label} unavailable`, error);
		return {
			status: "error",
			message: `${label} unavailable: ${getErrorMessage(error)}`,
		};
	}
}

async function collectCpu(): Promise<CpuSnapshot> {
	const load = await si.currentLoad();

	return {
		overallLoadPercent: load.currentLoad,
		userLoadPercent: load.currentLoadUser,
		systemLoadPercent: load.currentLoadSystem,
		averageLoad: load.avgLoad,
		perCoreLoadPercent: load.cpus.map((core) => core.load),
	};
}

async function collectMemory(): Promise<MemorySnapshot> {
	const memory = await si.mem();
	const utilizationPercent = toPercent(memory.used, memory.total);
	const swapUtilizationPercent = toPercent(memory.swapused, memory.swaptotal);

	return {
		totalBytes: memory.total,
		usedBytes: memory.used,
		freeBytes: memory.free,
		availableBytes: memory.available,
		activeBytes: memory.active,
		swapTotalBytes: memory.swaptotal,
		swapUsedBytes: memory.swapused,
		utilizationPercent,
		swapUtilizationPercent,
	};
}

async function collectDisk(): Promise<DiskSnapshot> {
	const [volumes, io] = await Promise.all([si.fsSize(), si.disksIO()]);

	return {
		volumes: volumes.map((volume) => ({
			name: volume.fs,
			type: volume.type,
			mount: volume.mount,
			sizeBytes: volume.size,
			usedBytes: volume.used,
			availableBytes: volume.available,
			utilizationPercent: volume.use,
			isReadWrite: volume.rw ?? false,
		})),
		io: {
			readOperations: io.rIO,
			writeOperations: io.wIO,
			totalOperations: io.tIO,
			readOpsPerSecond: io.rIO_sec,
			writeOpsPerSecond: io.wIO_sec,
			totalOpsPerSecond: io.tIO_sec,
			sampleMs: io.ms,
		},
	};
}

async function collectProcesses(
	processLimit: number,
): Promise<ProcessCollectionSnapshot> {
	const processes = await si.processes();

	const list = [...processes.list]
		.sort((left, right) => right.cpu - left.cpu || right.memRss - left.memRss)
		.slice(0, processLimit)
		.map((process) => ({
			pid: process.pid,
			parentPid: process.parentPid,
			name: process.name,
			cpuPercent: process.cpu,
			memoryPercent: process.mem,
			memoryBytes: process.memRss,
			state: process.state,
			startedAt: process.started,
			user: process.user,
		}));

	return {
		total: processes.all,
		running: processes.running,
		blocked: processes.blocked,
		sleeping: processes.sleeping,
		list,
	};
}

async function collectNetwork(): Promise<NetworkSnapshot> {
	const [interfaces, stats] = await Promise.all([
		si.networkInterfaces(),
		si.networkStats("*"),
	]);

	const statsByName = new Map(stats.map((stat) => [stat.iface, stat]));

	return {
		interfaces: interfaces.map((networkInterface) => {
			const stat = statsByName.get(networkInterface.iface);

			return {
				name: networkInterface.iface,
				displayName: networkInterface.ifaceName,
				isDefault: networkInterface.default,
				ipv4: networkInterface.ip4,
				ipv6: networkInterface.ip6,
				macAddress: networkInterface.mac,
				state: stat?.operstate ?? "unknown",
				receivedBytes: stat?.rx_bytes ?? 0,
				transmittedBytes: stat?.tx_bytes ?? 0,
				receivedBytesPerSecond: stat?.rx_sec ?? null,
				transmittedBytesPerSecond: stat?.tx_sec ?? null,
				sampleMs: stat?.ms ?? 0,
			};
		}),
	};
}

function normalizeProcessLimit(limit?: number): number {
	if (typeof limit !== "number" || Number.isNaN(limit)) {
		return DEFAULT_PROCESS_LIMIT;
	}

	return Math.max(1, Math.min(MAX_PROCESS_LIMIT, Math.trunc(limit)));
}

function toPercent(value: number, total: number): number {
	if (total <= 0) {
		return 0;
	}

	return (value / total) * 100;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "This metric is not available on the current machine.";
}
