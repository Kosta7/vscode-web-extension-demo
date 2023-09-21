import * as vscode from "vscode";

import { apiUrlOrigin } from "../utilities/constants";
import { setIsAuthorized } from "./setIsAuthorized";
import { setIsFileTreeOpen } from "./setIsFileTreeOpen";

let pollAuthorizationStatusIntervalId: NodeJS.Timeout;
const pollAuthorizationStatus = async (
  context: vscode.ExtensionContext,
  callback: () => void
) => {
  try {
    const sessionId = await context.secrets.get("sessionId");
    if (!sessionId) return;

    const response = await fetch(`${apiUrlOrigin}/check-authorization`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    if (response.status === 200) {
      setIsAuthorized(context, true);
      callback();
      clearInterval(pollAuthorizationStatusIntervalId);
    }
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  }
};

export const authorize = async (context: vscode.ExtensionContext) => {
  try {
    const authorizationResponse = await fetch(`${apiUrlOrigin}/authorize`, {
      method: "POST",
    });
    const { redirect_url: redirectUrl, session_id: sessionId } =
      await authorizationResponse.json();
    if (!redirectUrl || !sessionId)
      throw new Error("Invalid response from the server");

    vscode.env.openExternal(vscode.Uri.parse(redirectUrl));
    context.secrets.store("sessionId", sessionId);

    pollAuthorizationStatusIntervalId = setInterval(
      () =>
        pollAuthorizationStatus(context, () =>
          setIsFileTreeOpen(context, true)
        ),
      1000
    );
    setTimeout(
      () => {
        clearInterval(pollAuthorizationStatusIntervalId);
      },
      1000 * 60 * 10
    ); // 10 minutes
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  }
};
