import Electrobun, { BrowserView, BrowserWindow, Updater } from "electrobun/bun";
import { MOLE_COMMAND_TIMEOUT_MS } from "../shared/mole";
import type { MonitoringRpcSchema } from "../shared/monitoring";
import { closeDb } from "./db";
import {
	DEV_SERVER_URL,
	MAIN_VIEW_URL,
	resolveMainViewUrl,
} from "./mainViewUrl";
import { getMoleStatus, runMoleWorkflow } from "./mole";
import { getMonitoringSnapshot } from "./monitoring";
import {
	clearWorkflowHistory,
	getUserSettings,
	getWorkflowHistory,
	updateUserSetting,
} from "./persistence-handlers";

const ENABLE_HMR = process.env.ELECTROBUN_USE_HMR === "1";

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	const url = await resolveMainViewUrl({
		channel,
		enableHmr: ENABLE_HMR,
	});

	if (url === DEV_SERVER_URL) {
		console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
		return url;
	}

	if (channel === "dev" && ENABLE_HMR) {
		console.log(
			`HMR requested, but ${DEV_SERVER_URL} did not match this app. Falling back to ${MAIN_VIEW_URL}.`,
		);
	} else if (channel === "dev") {
		console.log(
			`Using bundled renderer at ${MAIN_VIEW_URL}. Run 'bun run dev:hmr' for explicit HMR.`,
		);
	}

	return url;
}

// Create the main application window
const url = await getMainViewUrl();

const monitoringRpc = BrowserView.defineRPC<MonitoringRpcSchema>({
	handlers: {
		requests: {
			getMonitoringSnapshot,
			getMoleStatus,
			runMoleWorkflow,
			getUserSettings,
			updateUserSetting,
			getWorkflowHistory,
			clearWorkflowHistory,
		},
		messages: {},
	},
	maxRequestTime: MOLE_COMMAND_TIMEOUT_MS + 10_000,
});

const mainWindow = new BrowserWindow({
	title: "macOS System Optimizer",
	url,
	rpc: monitoringRpc,
	frame: {
		width: 1_100,
		height: 760,
		x: 200,
		y: 120,
	},
});

Electrobun.events.on("before-quit", async () => {
	closeDb();
});

void mainWindow;

console.log("macOS System Optimizer monitoring foundation started!");
