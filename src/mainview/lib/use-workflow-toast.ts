import { useEffect } from "react";

import {
	getMoleWorkflowDefinition,
	type MoleCommandResult,
} from "../../shared/mole";
import type { AddToastOptions } from "../store/toast-store";
import { useToast } from "../store/toast-store";

export function getWorkflowToastOptions(
	result: MoleCommandResult,
): Pick<AddToastOptions, "description" | "title" | "variant"> {
	const workflowName =
		getMoleWorkflowDefinition(result.workflowId)?.title ?? result.workflowId;

	if (result.ok) {
		return {
			title: workflowName,
			description: "completed successfully",
			variant: "success",
		};
	}

	return {
		title: workflowName,
		description: result.error ?? "Workflow failed.",
		variant: "error",
	};
}

export function useWorkflowToast(result: MoleCommandResult | null) {
	const { toast } = useToast();

	useEffect(() => {
		if (!result) {
			return;
		}

		toast(getWorkflowToastOptions(result));
	}, [result, toast]);
}