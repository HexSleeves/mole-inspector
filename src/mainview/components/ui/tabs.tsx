import {
	type ButtonHTMLAttributes,
	createContext,
	type HTMLAttributes,
	useContext,
	useId,
	useMemo,
	useState,
} from "react";

import { cn } from "../../lib/utils";

type TabsContextValue = {
	baseId: string;
	value: string;
	setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = HTMLAttributes<HTMLDivElement> & {
	defaultValue: string;
	value?: string;
	onValueChange?: (value: string) => void;
};

export function Tabs({
	className,
	defaultValue,
	value,
	onValueChange,
	...props
}: TabsProps) {
	const generatedId = useId();
	const [internalValue, setInternalValue] = useState(defaultValue);
	const currentValue = value ?? internalValue;
	const contextValue = useMemo<TabsContextValue>(
		() => ({
			baseId: generatedId,
			value: currentValue,
			setValue: (nextValue) => {
				if (value === undefined) {
					setInternalValue(nextValue);
				}

				onValueChange?.(nextValue);
			},
		}),
		[currentValue, generatedId, onValueChange, value],
	);

	return (
		<TabsContext.Provider value={contextValue}>
			<div className={cn("space-y-4", className)} {...props} />
		</TabsContext.Provider>
	);
}

export function TabsList({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			role="tablist"
			className={cn(
				"inline-flex w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-2 sm:w-auto",
				className,
			)}
			{...props}
		/>
	);
}

type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	value: string;
};

export function TabsTrigger({
	className,
	onClick,
	value,
	...props
}: TabsTriggerProps) {
	const context = useTabsContext();
	const isSelected = context.value === value;
	const triggerId = getTriggerId(context.baseId, value);
	const contentId = getContentId(context.baseId, value);

	return (
		<button
			type="button"
			role="tab"
			id={triggerId}
			aria-selected={isSelected}
			aria-controls={contentId}
			tabIndex={isSelected ? 0 : -1}
			data-state={isSelected ? "active" : "inactive"}
			className={cn(
				"inline-flex min-w-28 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:pointer-events-none disabled:opacity-50",
				isSelected
					? "bg-sky-400 text-slate-950 shadow-sm shadow-sky-950/20"
					: "bg-transparent hover:bg-slate-900/80 hover:text-slate-50",
				className,
			)}
			onClick={(event) => {
				context.setValue(value);
				onClick?.(event);
			}}
			{...props}
		/>
	);
}

type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
	value: string;
};

export function TabsContent({
	className,
	children,
	value,
	...props
}: TabsContentProps) {
	const context = useTabsContext();
	const isSelected = context.value === value;

	return (
		<div
			role="tabpanel"
			id={getContentId(context.baseId, value)}
			aria-labelledby={getTriggerId(context.baseId, value)}
			data-state={isSelected ? "active" : "inactive"}
			hidden={!isSelected}
			className={cn("space-y-6", className)}
			{...props}
		>
			{children}
		</div>
	);
}

function useTabsContext() {
	const context = useContext(TabsContext);

	if (!context) {
		throw new Error("Tabs components must be used within <Tabs>.");
	}

	return context;
}

function getTriggerId(baseId: string, value: string) {
	return `${baseId}-trigger-${value}`;
}

function getContentId(baseId: string, value: string) {
	return `${baseId}-content-${value}`;
}
