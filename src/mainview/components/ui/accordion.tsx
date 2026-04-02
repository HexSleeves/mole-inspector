import {
	type ButtonHTMLAttributes,
	createContext,
	type HTMLAttributes,
	type RefObject,
	useContext,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";

import { cn } from "../../lib/utils";

type AccordionType = "single" | "multiple";

type AccordionContextValue = {
	baseId: string;
	containerRef: RefObject<HTMLDivElement | null>;
	focusBoundary: (direction: "first" | "last") => void;
	focusRelative: (currentValue: string, offset: number) => void;
	isItemOpen: (value: string) => boolean;
	toggleItem: (value: string) => void;
};

type AccordionItemContextValue = {
	contentId: string;
	open: boolean;
	toggle: () => void;
	triggerId: string;
	value: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

type AccordionSingleProps = HTMLAttributes<HTMLDivElement> & {
	defaultValue?: string;
	type: "single";
};

type AccordionMultipleProps = HTMLAttributes<HTMLDivElement> & {
	defaultValue?: string[];
	type: "multiple";
};

type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

/**
 * Groups related disclosure items with keyboard navigation and shared open-state handling.
 */
export function Accordion({
	children,
	className,
	defaultValue,
	type,
	...props
}: AccordionProps) {
	const baseId = useId();
	const containerRef = useRef<HTMLDivElement>(null);
	const [openValues, setOpenValues] = useState(() =>
		getInitialOpenValues(type, defaultValue),
	);
	const contextValue = useMemo<AccordionContextValue>(
		() => ({
			baseId,
			containerRef,
			focusBoundary: (direction) => {
				const triggers = getTriggerElements(containerRef.current);
				if (triggers.length === 0) {
					return;
				}

				const targetIndex = direction === "first" ? 0 : triggers.length - 1;
				triggers[targetIndex]?.focus();
			},
			focusRelative: (currentValue, offset) => {
				const triggers = getTriggerElements(containerRef.current);
				const currentIndex = triggers.findIndex(
					(trigger) => trigger.dataset.accordionValue === currentValue,
				);

				if (currentIndex < 0) {
					return;
				}

				const nextIndex = (currentIndex + offset + triggers.length) % triggers.length;
				triggers[nextIndex]?.focus();
			},
			isItemOpen: (value) => openValues.has(value),
			toggleItem: (value) => {
				setOpenValues((currentValues) => {
					const nextValues = new Set(currentValues);

					if (type === "single") {
						if (currentValues.has(value)) {
							nextValues.clear();
							return nextValues;
						}

						return new Set([value]);
					}

					if (nextValues.has(value)) {
						nextValues.delete(value);
					} else {
						nextValues.add(value);
					}

					return nextValues;
				});
			},
		}),
		[baseId, openValues, type],
	);

	return (
		<AccordionContext.Provider value={contextValue}>
			<div
				ref={containerRef}
				className={cn("space-y-3", className)}
				data-accordion-type={type}
				{...props}
			>
				{children}
			</div>
		</AccordionContext.Provider>
	);
}

type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
	value: string;
};

/**
 * Defines one collapsible item within an accordion group.
 */
export function AccordionItem({
	children,
	className,
	value,
	...props
}: AccordionItemProps) {
	const accordion = useAccordionContext();
	const open = accordion.isItemOpen(value);
	const itemId = getItemId(accordion.baseId, value);
	const contextValue = useMemo<AccordionItemContextValue>(
		() => ({
			contentId: `${itemId}-content`,
			open,
			toggle: () => accordion.toggleItem(value),
			triggerId: `${itemId}-trigger`,
			value,
		}),
		[accordion, itemId, open, value],
	);

	return (
		<AccordionItemContext.Provider value={contextValue}>
			<div
				data-state={open ? "open" : "closed"}
				className={cn(
					"overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</AccordionItemContext.Provider>
	);
}

/**
 * Toggles an accordion item and exposes the ARIA button semantics for its content region.
 */
export function AccordionTrigger({
	children,
	className,
	onClick,
	onKeyDown,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
	const accordion = useAccordionContext();
	const item = useAccordionItemContext();
	const skipClickRef = useRef(false);

	return (
		<button
			type="button"
			id={item.triggerId}
			aria-controls={item.contentId}
			aria-expanded={item.open}
			data-accordion-trigger="true"
			data-accordion-value={item.value}
			data-state={item.open ? "open" : "closed"}
			className={cn(
				"flex w-full items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:pointer-events-none disabled:opacity-50",
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

				item.toggle();
			}}
			onKeyDown={(event) => {
				onKeyDown?.(event);

				if (event.defaultPrevented) {
					return;
				}

				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					skipClickRef.current = true;
					item.toggle();
					return;
				}

				if (event.key === "ArrowDown") {
					event.preventDefault();
					accordion.focusRelative(item.value, 1);
					return;
				}

				if (event.key === "ArrowUp") {
					event.preventDefault();
					accordion.focusRelative(item.value, -1);
					return;
				}

				if (event.key === "Home") {
					event.preventDefault();
					accordion.focusBoundary("first");
					return;
				}

				if (event.key === "End") {
					event.preventDefault();
					accordion.focusBoundary("last");
				}
			}}
			{...props}
		>
			<span>{children}</span>
			<ChevronDownIcon
				className={cn(
					"size-4 shrink-0 text-slate-400 transition-transform duration-200",
					item.open && "rotate-180",
				)}
			/>
		</button>
	);
}

/**
 * Renders the content region associated with an accordion item.
 */
export function AccordionContent({
	children,
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	const item = useAccordionItemContext();

	return (
		<div
			id={item.contentId}
			role="region"
			aria-hidden={!item.open}
			aria-labelledby={item.triggerId}
			data-state={item.open ? "open" : "closed"}
			className={cn(
				"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
				item.open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				className,
			)}
			{...props}
		>
			<div className={cn("min-h-0 overflow-hidden", !item.open && "invisible")}>
				<div className="px-4 pb-4 text-sm text-slate-300">{children}</div>
			</div>
		</div>
	);
}

function useAccordionContext() {
	const context = useContext(AccordionContext);

	if (!context) {
		throw new Error("Accordion components must be used within <Accordion>.");
	}

	return context;
}

function useAccordionItemContext() {
	const context = useContext(AccordionItemContext);

	if (!context) {
		throw new Error(
			"Accordion item components must be used within <AccordionItem>.",
		);
	}

	return context;
}

function getInitialOpenValues(
	type: AccordionType,
	defaultValue: string | string[] | undefined,
) {
	if (type === "single") {
		return new Set(defaultValue ? [defaultValue] : []);
	}

	return new Set(defaultValue ?? []);
}

function getItemId(baseId: string, value: string) {
	return `${baseId}-item-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function getTriggerElements(container: HTMLDivElement | null) {
	if (!container) {
		return [];
	}

	return Array.from(
		container.querySelectorAll<HTMLButtonElement>("[data-accordion-trigger='true']"),
	);
}

function ChevronDownIcon({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 16 16"
			fill="none"
			className={className}
		>
			<path
				d="M4 6.5L8 10.5L12 6.5"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
		</svg>
	);
}