import { cva } from "class-variance-authority";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils";
import { useToast } from "../../store/toast-store";
import { Button } from "./button";

const toastVariants = cva(
	"pointer-events-auto w-full rounded-2xl border p-4 shadow-lg shadow-slate-950/30",
	{
		variants: {
			variant: {
				success: "border-emerald-400/30 bg-slate-950/95 text-emerald-100",
				error: "border-rose-400/30 bg-slate-950/95 text-rose-100",
				info: "border-sky-400/30 bg-slate-950/95 text-sky-100",
			},
		},
		defaultVariants: {
			variant: "info",
		},
	},
);

/**
 * Renders queued toast notifications in a fixed portal near the app viewport edge.
 */
export function Toaster() {
	const { dismiss, toasts } = useToast();

	if (!toasts.length) {
		return null;
	}

	const content = (
		<div
			aria-atomic="true"
			aria-live="polite"
			className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:bottom-6 sm:right-6"
		>
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={cn(toastVariants({ variant: toast.variant }))}
					role="status"
				>
					<div className="flex items-start gap-3">
						<div className="min-w-0 flex-1">
							{toast.title ? (
								<p className="font-medium text-slate-50">{toast.title}</p>
							) : null}
							<p className={cn("text-sm leading-5", toast.title ? "mt-1" : undefined)}>
								{toast.description}
							</p>
						</div>
						<Button
							aria-label="Dismiss notification"
							className="h-7 w-7 shrink-0 rounded-full p-0 text-current hover:bg-slate-900/70"
							size="sm"
							type="button"
							variant="ghost"
							onClick={() => dismiss(toast.id)}
						>
							×
						</Button>
					</div>
				</div>
			))}
		</div>
	);

	if (typeof document === "undefined") {
		return content;
	}

	return createPortal(content, document.body);
}