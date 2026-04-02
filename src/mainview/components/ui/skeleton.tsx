import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
	width?: CSSProperties["width"];
	height?: CSSProperties["height"];
};

/**
 * Renders a lightweight placeholder block sized to match pending content.
 */
export function Skeleton({
	className,
	height,
	style,
	width,
	...props
}: SkeletonProps) {
	return (
		<div
			aria-hidden="true"
			className={cn("animate-pulse rounded bg-slate-800", className)}
			style={{ ...style, width, height }}
			{...props}
		/>
	);
}