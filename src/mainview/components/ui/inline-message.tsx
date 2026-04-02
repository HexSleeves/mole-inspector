import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

const inlineMessageVariants = cva("rounded-xl border p-3 text-sm leading-5", {
	variants: {
		variant: {
			info: "border-sky-400/20 bg-sky-400/10 text-sky-100",
			success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
			warning: "border-amber-400/20 bg-amber-400/10 text-amber-100",
			error: "border-rose-400/20 bg-rose-400/10 text-rose-100",
			empty: "border-slate-800 bg-slate-900/60 text-slate-400",
		},
	},
	defaultVariants: {
		variant: "info",
	},
});

type InlineMessageProps = HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof inlineMessageVariants>;

/**
 * Displays inline informational, warning, success, or error feedback inside a view.
 */
export function InlineMessage({
	className,
	role,
	variant,
	...props
}: InlineMessageProps) {
	const resolvedRole =
		role ?? (variant === "error" || variant === "warning" ? "alert" : undefined);

	return (
		<div
			className={cn(inlineMessageVariants({ className, variant }))}
			role={resolvedRole}
			{...props}
		/>
	);
}