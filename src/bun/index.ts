import { BrowserView, BrowserWindow, Updater } from "electrobun/bun";

import { getMonitoringSnapshot } from "./monitoring";
import type { MonitoringRpcSchema } from "../shared/monitoring";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

// Create the main application window
const url = await getMainViewUrl();

const monitoringRpc = BrowserView.defineRPC<MonitoringRpcSchema>({
	handlers: {
		requests: {
			getMonitoringSnapshot,
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
