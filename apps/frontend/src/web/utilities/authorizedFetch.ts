import * as vscode from "vscode";
import { unauthorize } from "../commands/unauthorize";
import { authorize } from "../commands/authorize";

export const authorizedFetch = async (
  input: RequestInfo,
  init?: RequestInit,
  context?: vscode.ExtensionContext
): Promise<Response> => {
  try {
    const response = await fetch(input, init);
    if (response.status === 401 && context) {
      try {
        await unauthorize(context);
      } finally {
        authorize(context);
      }
    }

    return response;
  } catch (e) {
    throw e;
  }
};
