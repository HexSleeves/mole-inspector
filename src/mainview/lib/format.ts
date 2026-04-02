export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return "0 B";
	}

	const units = ["B", "KB", "MB", "GB", "TB"];
	let value = bytes;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}

	return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatPercent(value: number): string {
	if (!Number.isFinite(value)) {
		return "0.0%";
	}

	return `${value.toFixed(1)}%`;
}

export function formatRate(bytesPerSecond: number | null): string {
	if (bytesPerSecond === null) {
		return "warming up";
	}

	return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatOps(opsPerSecond: number | null): string {
	if (opsPerSecond === null) {
		return "warming up";
	}

	return `${Math.round(opsPerSecond)}/s`;
}

export function formatTime(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString();
}