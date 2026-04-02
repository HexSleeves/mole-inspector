import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppErrorBoundary } from "./components/app-error-boundary";
import { Toaster } from "./components/ui/toast";
import { Dashboard } from "./dashboard";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

const rootElement = document.getElementById("root");

if (!(rootElement instanceof HTMLElement)) {
	throw new Error('Expected to find the app root element with id "root".');
}

createRoot(rootElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<AppErrorBoundary>
				<Dashboard />
			</AppErrorBoundary>
			<Toaster />
		</QueryClientProvider>
	</StrictMode>,
);
