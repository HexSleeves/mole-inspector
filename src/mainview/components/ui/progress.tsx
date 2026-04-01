import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../lib/utils";

type ProgressProps = ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
	value?: number;
};

export function Progress({ className, value = 0, ...props }: ProgressProps) {
	const clampedValue = Math.max(0, Math.min(100, value));

	return (
		<ProgressPrimitive.Root
			className={cn(
				"relative h-2 w-full overflow-hidden rounded-full bg-slate-900",
				className,
			)}
			value={clampedValue}
			{...props}
		>
			<ProgressPrimitive.Indicator
				className="h-full w-full flex-1 bg-sky-400 transition-all"
				style={{ transform: `translateX(-${100 - clampedValue}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
}
