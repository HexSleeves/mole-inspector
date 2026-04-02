import { describe, expect, test } from "bun:test";
import type { MonitoringSnapshot, NetworkSnapshot } from "../shared/monitoring";
import { renderToStaticMarkup } from "react-dom/server";

const networkData: NetworkSnapshot = {
	interfaces: [
		{
			displayName: "Wi‑Fi",
			ipv4: "192.168.1.5",
			ipv6: "fe80::1",
			isDefault: true,
			macAddress: "00:11:22:33:44:55",
			name: "en0",
			receivedBytes: 10_000,
			receivedBytesPerSecond: 2_048,
			state: "up",
			sampleMs: 2_000,
			transmittedBytes: 5_000,
			transmittedBytesPerSecond: 1_024,
		},
	],
};

const snapshot: MonitoringSnapshot = {
	collectedAt: "2026-04-02T03:00:00.000Z",
	cpu: {
		status: "ok",
		data: {
			averageLoad: 0.5,
			overallLoadPercent: 25,
			perCoreLoadPercent: [25, 20],
			systemLoadPercent: 10,
			userLoadPercent: 15,
		},
	},
	memory: {
		status: "ok",
		data: {
			activeBytes: 2_000,
			availableBytes: 4_000,
			freeBytes: 2_000,
			swapTotalBytes: 8_000,
			swapUsedBytes: 1_000,
			swapUtilizationPercent: 12.5,
			totalBytes: 8_000,
			usedBytes: 4_000,
			utilizationPercent: 50,
		},
	},
	disk: {
		status: "ok",
		data: {
			io: {
				readOperations: 10,
				readOpsPerSecond: 5,
				sampleMs: 2_000,
				totalOperations: 20,
				totalOpsPerSecond: 10,
				writeOperations: 10,
				writeOpsPerSecond: 5,
			},
			volumes: [],
		},
	},
	processes: {
		status: "ok",
		data: {
			blocked: 0,
			list: [],
			running: 5,
			sleeping: 3,
			total: 8,
		},
	},
	network: {
		status: "ok",
		data: networkData,
	},
};

describe("dashboard panels", () => {
	test("exports extracted panel modules and shared stat components", async () => {
		const panels = await import("./components/panels");
		const stats = await import("./components/ui/metric-stat");

		expect(typeof panels.CpuPanel).toBe("function");
		expect(typeof panels.MemoryPanel).toBe("function");
		expect(typeof panels.DiskPanel).toBe("function");
		expect(typeof panels.NetworkPanel).toBe("function");
		expect(typeof panels.ProcessesPanel).toBe("function");
		expect(typeof panels.CollectorHealthPanel).toBe("function");
		expect(typeof panels.buildSummaryCards).toBe("function");
		expect(typeof stats.MetricStat).toBe("function");
		expect(typeof stats.CompactMetricStat).toBe("function");
	});

	test("renders the shared stat variants and new collapsible/accordion wrappers", async () => {
		const { CollectorHealthPanel, NetworkPanel } = await import("./components/panels");
		const { CompactMetricStat, MetricStat } = await import("./components/ui/metric-stat");

		const metricMarkup = renderToStaticMarkup(
			<>
				<MetricStat label="CPU" value="25.0%" />
				<CompactMetricStat label="Exit code" value="0" />
			</>,
		);
		const collectorMarkup = renderToStaticMarkup(
			<CollectorHealthPanel
				queryError="Bridge timed out"
				snapshot={snapshot}
			/>,
		);
		const networkMarkup = renderToStaticMarkup(
			<NetworkPanel metric={{ status: "ok", data: networkData }} />,
		);

		expect(metricMarkup).toContain("text-2xl");
		expect(metricMarkup).toContain("text-base");
		expect(collectorMarkup).toContain('aria-expanded="false"');
		expect(collectorMarkup).toContain("previous sample: Bridge timed out");
		expect(networkMarkup).toContain('data-accordion-trigger="true"');
		expect(networkMarkup).toContain("Interface details");
	});
});