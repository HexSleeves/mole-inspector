import {
	type ButtonHTMLAttributes,
	createContext,
	type HTMLAttributes,
	type KeyboardEvent,
	useContext,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";

import { cn } from "../../lib/utils";

type CollapsibleContextValue = {
	contentId: string;
	open: boolean;
	toggle: () => void;
	triggerId: string;
};

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

type CollapsibleProps = HTMLAttributes<HTMLDivElement> & {
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
};

/**
 * Provides a single expandable region with shared trigger/content state.
 */
export function Collapsible({
	children,
	className,
	defaultOpen = false,
	onOpenChange,
	...props
}: CollapsibleProps) {
	const baseId = useId();
	const [open, setOpen] = useState(defaultOpen);
	const contextValue = useMemo<CollapsibleContextValue>(
		() => ({
			contentId: `${baseId}-content`,
			open,
			toggle: () => {
				setOpen((currentOpen) => {
					const nextOpen = !currentOpen;
					onOpenChange?.(nextOpen);
					return nextOpen;
				});
			},
			triggerId: `${baseId}-trigger`,
		}),
		[baseId, onOpenChange, open],
	);

	return (
		<CollapsibleContext.Provider value={contextValue}>
			<div className={cn("space-y-2", className)} {...props}>
				{children}
			</div>
		</CollapsibleContext.Provider>
	);
}

/**
 * Toggles the parent collapsible while preserving button semantics and keyboard support.
 */
export function CollapsibleTrigger({
	className,
	onClick,
	onKeyDown,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
	const context = useCollapsibleContext();
	const skipClickRef = useRef(false);

	return (
		<button
			type="button"
			id={context.triggerId}
			aria-controls={context.contentId}
			aria-expanded={context.open}
			data-state={context.open ? "open" : "closed"}
			className={cn(
				"flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:pointer-events-none disabled:opacity-50",
				className,
			)}
			onClick={(event) => {
				onClick?.(event);

				if (event.defaultPrevented) {
					return;
				}

				if (skipClickRef.current) {
					skipClickRef.current = false;
					return;
				}

				context.toggle();
			}}
			onKeyDown={(event) => {
				onKeyDown?.(event);

				if (event.defaultPrevented) {
					return;
				}

				handleToggleKey(event, () => {
					skipClickRef.current = true;
					context.toggle();
				});
			}}
			{...props}
		/>
	);
}

/**
 * Renders the expandable content region for a collapsible section.
 */
export function CollapsibleContent({
	children,
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	const context = useCollapsibleContext();

	return (
		<div
			id={context.contentId}
			role="region"
			aria-hidden={!context.open}
			aria-labelledby={context.triggerId}
			data-state={context.open ? "open" : "closed"}
			className={cn(
				"grid overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 text-sm text-slate-300 transition-[grid-template-rows,opacity] duration-200 ease-out",
				context.open
					? "grid-rows-[1fr] opacity-100"
					: "invisible grid-rows-[0fr] opacity-0",
				className,
			)}
			{...props}
		>
			<div className="min-h-0 overflow-hidden">
				<div className="px-4 pb-4 pt-0">{children}</div>
			</div>
		</div>
	);
}

function useCollapsibleContext() {
	const context = useContext(CollapsibleContext);

	if (!context) {
		throw new Error("Collapsible components must be used within <Collapsible>.");
	}

	return context;
}

function handleToggleKey(
	event: KeyboardEvent<HTMLButtonElement>,
	toggle: () => void,
) {
	if (event.key !== "Enter" && event.key !== " ") {
		return;
	}

	event.preventDefault();
	toggle();
}