import {
	MOLE_COMMAND_TIMEOUT_MS,
	MOLE_INSTALL_COMMAND,
	MOLE_INSTALL_HINT,
	getMoleWorkflowDefinition,
	type MoleAvailability,
	type MoleCommandResult,
	type MoleStatusSnapshot,
	type MoleStatusSummary,
	type MoleWorkflowRequest,
	MOLE_WORKFLOWS,
} from "../shared/mole";

type SpawnedProcess = {
	exited: Promise<number>;
	stdout?: ReadableStream<Uint8Array> | null;
	stderr?: ReadableStream<Uint8Array> | null;
	kill: () => void;
};

type MoleRuntime = {
	which: (command: string) => string | null;
	spawn: (cmd: string[]) => SpawnedProcess;
	now: () => Date;
	timeoutMs: number;
};

const DEFAULT_RUNTIME: MoleRuntime = {
	which: (command) => Bun.which(command),
	spawn: (cmd) =>
		Bun.spawn({
			cmd,
			stdout: "pipe",
			stderr: "pipe",
		}),
	now: () => new Date(),
	timeoutMs: MOLE_COMMAND_TIMEOUT_MS,
};

export async function getMoleStatus(): Promise<MoleStatusSnapshot> {
	return getMoleStatusWith(DEFAULT_RUNTIME);
}

export async function runMoleWorkflow(
	request: MoleWorkflowRequest,
): Promise<MoleCommandResult> {
	return runMoleWorkflowWith(request, DEFAULT_RUNTIME);
}

export async function getMoleStatusWith(
	runtime: MoleRuntime,
): Promise<MoleStatusSnapshot> {
	const checkedAt = runtime.now().toISOString();
	const availability = resolveMoleAvailability(runtime.which);

	if (!availability.isInstalled) {
		return {
			checkedAt,
			availability,
			summary: null,
			rawJson: null,
			error: null,
		};
	}

	const execution = await executeMoCommand(
		{
			mode: "preview",
			workflowId: MOLE_WORKFLOWS[0].id,
		},
		["status", "--json"],
		runtime,
	);
	const rawJson = execution.stdout || execution.combinedOutput || null;

	if (!execution.ok || !rawJson) {
		return {
			checkedAt,
			availability,
			summary: null,
			rawJson,
			error: execution.error ?? "Mole status did not return usable output.",
		};
	}

	const summary = parseMoleStatusSummary(rawJson);
	if (!summary) {
		return {
			checkedAt,
			availability,
			summary: null,
			rawJson,
			error: "Mole returned status output that could not be parsed as JSON.",
		};
	}

	return {
		checkedAt,
		availability,
		summary,
		rawJson,
		error: null,
	};
}

export async function runMoleWorkflowWith(
	request: MoleWorkflowRequest,
	runtime: MoleRuntime,
): Promise<MoleCommandResult> {
	const workflow = getMoleWorkflowDefinition(request.workflowId);
	if (!workflow) {
		return buildFailedResult(
			request,
			["mo", request.workflowId],
			runtime.now(),
			runtime.now(),
			`Unsupported Mole workflow: ${request.workflowId}`,
		);
	}

	const availability = resolveMoleAvailability(runtime.which);
	if (!availability.isInstalled) {
		const args =
			request.mode === "preview" ? workflow.previewArgs : workflow.runArgs;
		return buildFailedResult(
			request,
			["mo", ...args],
			runtime.now(),
			runtime.now(),
			`Mole is not installed. ${availability.installHint} Run \`${availability.installCommand}\` first.`,
		);
	}

	const args =
		request.mode === "preview" ? workflow.previewArgs : workflow.runArgs;
	return executeMoCommand(request, args, runtime);
}

export function parseMoleStatusSummary(
	rawJson: string,
): MoleStatusSummary | null {
	try {
		const parsed = JSON.parse(rawJson) as {
			host?: unknown;
			platform?: unknown;
			uptime?: unknown;
			health_score?: unknown;
			health_score_msg?: unknown;
			hardware?: {
				model?: unknown;
				total_ram?: unknown;
				disk_size?: unknown;
				os_version?: unknown;
			};
		};

		return {
			healthScore:
				typeof parsed.health_score === "number" ? parsed.health_score : null,
			healthLabel:
				typeof parsed.health_score_msg === "string"
					? parsed.health_score_msg
					: null,
			host: typeof parsed.host === "string" ? parsed.host : null,
			platform: typeof parsed.platform === "string" ? parsed.platform : null,
			uptime: typeof parsed.uptime === "string" ? parsed.uptime : null,
			model:
				typeof parsed.hardware?.model === "string"
					? parsed.hardware.model
					: null,
			totalRam:
				typeof parsed.hardware?.total_ram === "string"
					? parsed.hardware.total_ram
					: null,
			diskSize:
				typeof parsed.hardware?.disk_size === "string"
					? parsed.hardware.disk_size
					: null,
			osVersion:
				typeof parsed.hardware?.os_version === "string"
					? parsed.hardware.os_version
					: null,
		};
	} catch {
		return null;
	}
}

function resolveMoleAvailability(
	which: MoleRuntime["which"],
): MoleAvailability {
	const executablePath = which("mo");

	return {
		isInstalled: executablePath !== null,
		executablePath,
		installCommand: MOLE_INSTALL_COMMAND,
		installHint: MOLE_INSTALL_HINT,
	};
}

async function executeMoCommand(
	request: MoleWorkflowRequest,
	args: readonly string[],
	runtime: MoleRuntime,
): Promise<MoleCommandResult> {
	const command = ["mo", ...args];
	const startedAt = runtime.now();
	let process: SpawnedProcess | null = null;

	try {
		process = runtime.spawn(command);
		const [exitCode, stdout, stderr] = await Promise.all([
			waitForExit(process, runtime.timeoutMs),
			readProcessOutput(process.stdout),
			readProcessOutput(process.stderr),
		]);
		const finishedAt = runtime.now();
		const sanitizedStdout = sanitizeOutput(stdout);
		const sanitizedStderr = sanitizeOutput(stderr);
		const combinedOutput = [sanitizedStdout, sanitizedStderr]
			.filter(Boolean)
			.join("\n\n")
			.trim();

		return {
			workflowId: request.workflowId,
			mode: request.mode,
			command,
			ok: exitCode === 0,
			exitCode,
			startedAt: startedAt.toISOString(),
			finishedAt: finishedAt.toISOString(),
			durationMs: finishedAt.getTime() - startedAt.getTime(),
			stdout: sanitizedStdout,
			stderr: sanitizedStderr,
			combinedOutput,
			error:
				exitCode === 0
					? null
					: sanitizedStderr ||
						sanitizedStdout ||
						`Command exited with code ${exitCode}.`,
		};
	} catch (error) {
		try {
			process?.kill();
		} catch {}

		const [stdout, stderr] = await Promise.all([
			readProcessOutput(process?.stdout),
			readProcessOutput(process?.stderr),
		]);
		const finishedAt = runtime.now();
		const message = getErrorMessage(error);
		const sanitizedStdout = sanitizeOutput(stdout);
		const sanitizedStderr = sanitizeOutput(stderr);
		const combinedOutput = [sanitizedStdout, sanitizedStderr, message]
			.filter(Boolean)
			.join("\n\n")
			.trim();

		return {
			workflowId: request.workflowId,
			mode: request.mode,
			command,
			ok: false,
			exitCode: null,
			startedAt: startedAt.toISOString(),
			finishedAt: finishedAt.toISOString(),
			durationMs: finishedAt.getTime() - startedAt.getTime(),
			stdout: sanitizedStdout,
			stderr: sanitizedStderr,
			combinedOutput,
			error: message,
		};
	}
}

function buildFailedResult(
	request: MoleWorkflowRequest,
	command: string[],
	startedAt: Date,
	finishedAt: Date,
	error: string,
): MoleCommandResult {
	return {
		workflowId: request.workflowId,
		mode: request.mode,
		command,
		ok: false,
		exitCode: null,
		startedAt: startedAt.toISOString(),
		finishedAt: finishedAt.toISOString(),
		durationMs: finishedAt.getTime() - startedAt.getTime(),
		stdout: "",
		stderr: "",
		combinedOutput: error,
		error,
	};
}

async function waitForExit(
	process: SpawnedProcess,
	timeoutMs: number,
): Promise<number> {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	try {
		return await Promise.race([
			process.exited,
			new Promise<number>((_, reject) => {
				timeoutId = setTimeout(() => {
					try {
						process.kill();
					} catch {}
					reject(
						new Error(
							`Mole command timed out after ${Math.round(timeoutMs / 1000)} seconds.`,
						),
					);
				}, timeoutMs);
			}),
		]);
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

async function readProcessOutput(
	stream?: ReadableStream<Uint8Array> | null,
): Promise<string> {
	if (!stream) {
		return "";
	}

	try {
		return await new Response(stream).text();
	} catch {
		return "";
	}
}

function sanitizeOutput(value: string): string {
	return stripAnsi(value).trim();
}

function stripAnsi(value: string): string {
	return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Mole command failed unexpectedly.";
}
