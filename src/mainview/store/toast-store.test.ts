import { afterEach, describe, expect, test } from "bun:test";

import { useToastStore } from "./toast-store";

afterEach(() => {
	for (const toast of useToastStore.getState().toasts) {
		useToastStore.getState().dismissToast(toast.id);
	}
});

describe("toast store", () => {
	test("adds and dismisses toasts", () => {
		const id = useToastStore.getState().addToast({
			description: "Saved settings",
			variant: "success",
		});

		expect(useToastStore.getState().toasts).toHaveLength(1);
		expect(useToastStore.getState().toasts[0]).toMatchObject({
			description: "Saved settings",
			id,
			variant: "success",
		});

		useToastStore.getState().dismissToast(id);

		expect(useToastStore.getState().toasts).toHaveLength(0);
	});

	test("auto-dismisses toasts after the configured delay", async () => {
		const id = useToastStore.getState().addToast({
			description: "Heads up",
			durationMs: 20,
			variant: "info",
		});

		expect(
			useToastStore.getState().toasts.some((toast) => toast.id === id),
		).toBe(true);

		await Bun.sleep(50);

		expect(
			useToastStore.getState().toasts.some((toast) => toast.id === id),
		).toBe(false);
	});
});