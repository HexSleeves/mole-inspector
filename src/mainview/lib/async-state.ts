import type { UseQueryResult } from "@tanstack/react-query";

import { getErrorMessage } from "./errors";

export type AsyncState<T> =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "error"; error: string }
	| { status: "success"; data: T };

export function fromQuery<T>(query: UseQueryResult<T>): AsyncState<T> {
	if (query.isError) {
		return {
			status: "error",
			error: getErrorMessage(query.error),
		};
	}

	if (query.isSuccess) {
		return {
			status: "success",
			data: query.data,
		};
	}

	if (query.fetchStatus === "idle") {
		return { status: "idle" };
	}

	return { status: "loading" };
}