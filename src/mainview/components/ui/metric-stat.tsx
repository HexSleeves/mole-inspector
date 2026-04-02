import { cn } from "../../lib/utils";

type MetricStatProps = {
	label: string;
	value: string;
};

type MetricStatBaseProps = MetricStatProps & {
	className: string;
	valueClassName: string;
};

/**
 * Displays a metric label/value pair in the standard dashboard card style.
 */
export function MetricStat({ label, value }: MetricStatProps) {
	return (
		<MetricStatBase
			label={label}
			value={value}
			className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5"
			valueClassName="mt-1.5 text-2xl font-semibold text-slate-50"
		/>
	);
}

/**
 * Displays a more compact metric label/value pair for dense summary layouts.
 */
export function CompactMetricStat({ label, value }: MetricStatProps) {
	return (
		<MetricStatBase
			label={label}
			value={value}
			className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5"
			valueClassName="mt-1.5 text-base font-medium text-slate-100"
		/>
	);
}

function MetricStatBase({
	label,
	value,
	className,
	valueClassName,
}: MetricStatBaseProps) {
	return (
		<div className={className}>
			<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
				{label}
			</p>
			<p className={cn(valueClassName)}>{value}</p>
		</div>
	);
}