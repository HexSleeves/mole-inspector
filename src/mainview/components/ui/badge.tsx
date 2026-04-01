import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
	{
		variants: {
			variant: {
				default: "border-sky-400/30 bg-sky-400/10 text-sky-200",
				secondary: "border-slate-700 bg-slate-900 text-slate-300",
				success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
				warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
				destructive: "border-rose-400/30 bg-rose-400/10 text-rose-200",
				outline: "border-slate-700 text-slate-300",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

type BadgeProps = HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ className, variant }))} {...props} />
	);
}
