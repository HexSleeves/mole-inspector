import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
	test("marks the default tab as active and hides inactive content", () => {
		const markup = renderToStaticMarkup(
			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="processes">Processes</TabsTrigger>
				</TabsList>
				<TabsContent value="overview">Overview content</TabsContent>
				<TabsContent value="processes">Processes content</TabsContent>
			</Tabs>,
		);

		expect(markup).toContain('role="tablist"');
		expect(markup).toContain('aria-selected="true"');
		expect(markup).toContain('data-state="active"');
		expect(markup).toContain('aria-selected="false"');
		expect(markup).toContain('data-state="inactive"');
		expect(markup).toContain('hidden=""');
	});
});
