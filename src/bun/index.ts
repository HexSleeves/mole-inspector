import { BrowserView, BrowserWindow, Updater } from "electrobun/bun";
import type { MonitoringRpcSchema } from "../shared/monitoring";
import {
	DEV_SERVER_URL,
	MAIN_VIEW_URL,
	resolveMainViewUrl,
} from "./mainViewUrl";
import { getMoleStatus, runMoleWorkflow } from "./mole";
import { getMonitoringSnapshot } from "./monitoring";

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
		},
		messages: {},
	},
	maxRequestTime: 15_000,
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

void mainWindow;

console.log("macOS System Optimizer monitoring foundation started!");
