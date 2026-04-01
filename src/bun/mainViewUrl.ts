export const DEV_SERVER_URL = "http://localhost:5173";
export const MAIN_VIEW_URL = "views://mainview/index.html";

const MAIN_VIEW_MARKER = 'name="macos-system-optimizer-app" content="mainview"';

type HtmlResponse = {
	ok: boolean;
	text(): Promise<string>;
};

export async function resolveMainViewUrl(options: {
	channel: string;
	enableHmr: boolean;
	fetchHtml?: () => Promise<HtmlResponse>;
}): Promise<string> {
	const {
		channel,
		enableHmr,
		fetchHtml = () => fetch(DEV_SERVER_URL),
	} = options;

	if (channel !== "dev" || !enableHmr) {
		return MAIN_VIEW_URL;
	}

	try {
		const response = await fetchHtml();
		if (!response.ok) {
			return MAIN_VIEW_URL;
		}

		const html = await response.text();
		return html.includes(MAIN_VIEW_MARKER) ? DEV_SERVER_URL : MAIN_VIEW_URL;
	} catch {
		return MAIN_VIEW_URL;
	}
}
