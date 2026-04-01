import type {
	HTMLAttributes,
	TableHTMLAttributes,
	ThHTMLAttributes,
	TdHTMLAttributes,
} from "react";

import { cn } from "../../lib/utils";

export function Table({
	className,
	...props
}: TableHTMLAttributes<HTMLTableElement>) {
	return (
		<table
			className={cn("w-full caption-bottom text-sm", className)}
			{...props}
		/>
	);
}

export function TableHeader({
	className,
	...props
}: HTMLAttributes<HTMLTableSectionElement>) {
	return (
		<thead
			className={cn("[&_tr]:border-b [&_tr]:border-slate-800", className)}
			{...props}
		/>
	);
}

export function TableBody({
	className,
	...props
}: HTMLAttributes<HTMLTableSectionElement>) {
	return (
		<tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
	);
}

export function TableRow({
	className,
	...props
}: HTMLAttributes<HTMLTableRowElement>) {
	return (
		<tr
			className={cn(
				"border-b border-slate-900/80 transition-colors hover:bg-slate-900/70",
				className,
			)}
			{...props}
		/>
	);
}

export function TableHead({
	className,
	...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			className={cn(
				"h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-[0.2em] text-slate-400",
				className,
			)}
			{...props}
		/>
	);
}

export function TableCell({
	className,
	...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
	return (
		<td
			className={cn("p-4 align-middle text-slate-200", className)}
			{...props}
		/>
	);
}
