export const MOLE_INSTALL_COMMAND = "brew install mole";
export const MOLE_INSTALL_HINT =
	"Install Mole with Homebrew, then restart the app so the Electrobun main process can resolve `mo` on PATH.";
export const MOLE_COMMAND_TIMEOUT_MS = 120_000;

export type MoleWorkflowId = "clean" | "optimize" | "installer" | "purge";
export type MoleWorkflowMode = "preview" | "apply";
export type MoleCommandOutputState = "captured" | "empty";

export interface MoleAvailability {
	isInstalled: boolean;
	executablePath: string | null;
	installCommand: string;
	installHint: string;
}

export interface MoleStatusSummary {
	healthScore: number | null;
	healthLabel: string | null;
	host: string | null;
	platform: string | null;
	uptime: string | null;
	model: string | null;
	totalRam: string | null;
	diskSize: string | null;
	osVersion: string | null;
}

export interface MoleStatusSnapshot {
	checkedAt: string;
	availability: MoleAvailability;
	summary: MoleStatusSummary | null;
	rawJson: string | null;
	error: string | null;
}

export interface MoleWorkflowDefinition {
	id: MoleWorkflowId;
	title: string;
	description: string;
	previewLabel: string;
	runLabel: string;
	previewArgs: readonly string[];
	runArgs: readonly string[];
	confirmationMessage: string;
	previewRecommended: boolean;
}

export const MOLE_WORKFLOWS = [
	{
		id: "clean",
		title: "Clean caches and logs",
		description:
			"Preview and remove reclaimable caches, logs, and temporary files.",
		previewLabel: "Preview cleanup",
		runLabel: "Run cleanup",
		previewArgs: ["clean", "--dry-run"],
		runArgs: ["clean"],
		confirmationMessage:
			"Run `mo clean` now? This can remove caches, logs, and temporary files. Previewing first is recommended.",
		previewRecommended: true,
	},
	{
		id: "optimize",
		title: "Optimize system health",
		description:
			"Preview or apply Mole's safe system maintenance and optimization checks.",
		previewLabel: "Preview optimization",
		runLabel: "Run optimization",
		previewArgs: ["optimize", "--dry-run"],
		runArgs: ["optimize"],
		confirmationMessage:
			"Run `mo optimize` now? This can apply system maintenance changes. Previewing first is recommended.",
		previewRecommended: true,
	},
	{
		id: "installer",
		title: "Remove installer files",
		description:
			"Preview and remove leftover installer archives such as .dmg, .pkg, and .zip files.",
		previewLabel: "Preview installer cleanup",
		runLabel: "Remove installer files",
		previewArgs: ["installer", "--dry-run"],
		runArgs: ["installer"],
		confirmationMessage:
			"Run `mo installer` now? This can delete installer archives that Mole finds on disk. Previewing first is recommended.",
		previewRecommended: true,
	},
	{
		id: "purge",
		title: "Purge old build artifacts",
		description:
			"Preview or remove stale project artifacts under Mole's configured development paths.",
		previewLabel: "Preview purge",
		runLabel: "Run purge",
		previewArgs: ["purge", "--dry-run"],
		runArgs: ["purge"],
		confirmationMessage:
			"Run `mo purge` now? This can remove old project artifacts from your configured development directories. Previewing first is strongly recommended.",
		previewRecommended: true,
	},
] as const satisfies readonly MoleWorkflowDefinition[];

export interface MoleWorkflowRequest {
	workflowId: MoleWorkflowId;
	mode: MoleWorkflowMode;
}

export interface MoleCommandResult {
	workflowId: MoleWorkflowId;
	mode: MoleWorkflowMode;
	command: string[];
	ok: boolean;
	exitCode: number | null;
	startedAt: string;
	finishedAt: string;
	durationMs: number;
	stdout: string;
	stderr: string;
	combinedOutput: string;
	outputState: MoleCommandOutputState;
	error: string | null;
}

export function getMoleWorkflowDefinition(
	workflowId: MoleWorkflowId,
): MoleWorkflowDefinition | null {
	return MOLE_WORKFLOWS.find((workflow) => workflow.id === workflowId) ?? null;
}
