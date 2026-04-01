import { describe, expect, test } from "bun:test";

import { buildMemorySnapshot } from "./monitoring";

describe("buildMemorySnapshot", () => {
	test("on macOS it excludes reclaimable pages from RAM in use", () => {
		const gib = 1024 ** 3;
		const snapshot = buildMemorySnapshot(
			{
				total: 64 * gib,
				free: 5 * gib,
				used: 59 * gib,
				active: 24 * gib,
				available: 40 * gib,
				buffers: 0,
				cached: 0,
				slab: 0,
				buffcache: 35 * gib,
				reclaimable: 21 * gib,
				swaptotal: 2 * gib,
				swapused: 0.5 * gib,
				swapfree: 1.5 * gib,
				writeback: null,
				dirty: null,
			},
			{
				platform: "darwin",
				purgeableBytes: 1 * gib,
			},
		);

		expect(snapshot.usedBytes).toBe(37 * gib);
		expect(snapshot.availableBytes).toBe(27 * gib);
		expect(snapshot.utilizationPercent).toBeCloseTo(57.8125, 6);
		expect(snapshot.swapUtilizationPercent).toBe(25);
	});
});
