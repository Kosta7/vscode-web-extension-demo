import * as vscode from "vscode";

import { setIsAuthorized } from "./setIsAuthorized";
import { apiUrlOrigin, KEYS } from "../utilities/constants";
import { setIsFileTreeOpen } from "./setIsFileTreeOpen";

export const unauthorize = async (context: vscode.ExtensionContext) => {
  try {
    const sessionId = await context.secrets.get(KEYS.SESSION_ID);
    if (!sessionId) throw new Error("Error getting session id");

    await fetch(`${apiUrlOrigin}/unauthorize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  } finally {
    setIsAuthorized(context, false);
    setIsFileTreeOpen(context, false);
    context.secrets.delete(KEYS.SESSION_ID);
    vscode.window.showInformationMessage("Unauthorized");
  }
};
