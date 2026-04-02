import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
	id: string;
	title?: string;
	description: string;
	variant: ToastVariant;
	durationMs: number;
};

export type AddToastOptions = {
	id?: string;
	title?: string;
	description: string;
	variant?: ToastVariant;
	durationMs?: number;
};

type ToastStore = {
	toasts: Toast[];
	addToast: (options: AddToastOptions) => string;
	dismissToast: (id: string) => void;
};

const DEFAULT_TOAST_DURATION_MS = 5_000;
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearToastTimer(id: string) {
	const timer = toastTimers.get(id);
	if (timer) {
		clearTimeout(timer);
		toastTimers.delete(id);
	}
}

function createToastId() {
	return (
		globalThis.crypto?.randomUUID?.() ??
		`toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
	);
}

export const useToastStore = create<ToastStore>((set, get) => ({
	toasts: [],
	addToast: ({
		description,
		durationMs = DEFAULT_TOAST_DURATION_MS,
		id = createToastId(),
		title,
		variant = "info",
	}) => {
		clearToastTimer(id);

		const nextToast: Toast = {
			description,
			durationMs,
			id,
			title,
			variant,
		};

		set((state) => ({
			toasts: [...state.toasts.filter((toast) => toast.id !== id), nextToast],
		}));

		const timeoutId = setTimeout(() => {
			get().dismissToast(id);
		}, durationMs);
		toastTimers.set(id, timeoutId);

		return id;
	},
	dismissToast: (id) => {
		clearToastTimer(id);
		set((state) => ({
			toasts: state.toasts.filter((toast) => toast.id !== id),
		}));
	},
}));

export function useToast() {
	const toasts = useToastStore((state) => state.toasts);
	const addToast = useToastStore((state) => state.addToast);
	const dismissToast = useToastStore((state) => state.dismissToast);

	return {
		toasts,
		toast: addToast,
		dismiss: dismissToast,
	};
}