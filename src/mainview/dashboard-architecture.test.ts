import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

function readMainviewFile(path: string) {
	return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("dashboard is reduced to composition imports instead of inline panel definitions", () => {
	const source = readMainviewFile("./dashboard.tsx");

	expect(source).toContain('from "./components/panels"');
	expect(source).toContain("DashboardSkeleton");
	expect(source).not.toContain("function CpuPanel(");
	expect(source).not.toContain("function MemoryPanel(");
	expect(source).not.toContain("function DiskPanel(");
	expect(source).not.toContain("function NetworkPanel(");
	expect(source).not.toContain("function ProcessesPanel(");
	expect(source).not.toContain("function CollectorHealthPanel(");
	expect(source).not.toContain("function LoadingState(");
});

test("mole workflows consumes shared feedback/stat primitives and collapsible history", () => {
	const source = readMainviewFile("./mole-workflows.tsx");

	expect(source).toContain('from "./components/ui/metric-stat"');
	expect(source).toContain('from "./components/ui/inline-message"');
	expect(source).toContain('from "./components/ui/collapsible"');
	expect(source).toContain("<Collapsible");
	expect(source).not.toContain("function StatusStat(");
	expect(source).not.toContain("function InlineMessage(");
});

test("dashboard wiring hydrates persisted settings and workflow history from the bridge", () => {
	const dashboardSource = readMainviewFile("./dashboard.tsx");
	const storeSource = readMainviewFile("./store/dashboard-store.ts");
	const workflowsSource = readMainviewFile("./mole-workflows.tsx");

	expect(dashboardSource).toContain("useHydrateSettings()");
	expect(storeSource).toContain("hydrateFromSaved");
	expect(storeSource).toContain("getUserSettings");
	expect(storeSource).toContain("updateUserSetting");
	expect(workflowsSource).toContain("useQueryClient");
	expect(workflowsSource).toContain('queryKey: ["workflow-history"]');
	expect(workflowsSource).toContain("getWorkflowHistory({ limit: 5 })");
	expect(workflowsSource).toContain("invalidateQueries({ queryKey: [\"workflow-history\"] })");
	expect(workflowsSource).not.toContain("setHistory(");
});