import * as vscode from "vscode";

import { apiUrlOrigin, KEYS } from "../utilities/constants";
import { setIsAuthorized } from "./setIsAuthorized";
import { setIsFileTreeOpen } from "./setIsFileTreeOpen";

let pollAuthorizationStatusTimeoutId: NodeJS.Timeout;
const pollAuthorizationStatus = async (
  context: vscode.ExtensionContext,
  callback: Function
) => {
  try {
    const sessionId = await context.secrets.get(KEYS.SESSION_ID);
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
      clearTimeout(pollAuthorizationStatusTimeoutId);
    } else if (response.status === 401) {
      pollAuthorizationStatusTimeoutId = setTimeout(
        () => pollAuthorizationStatus(context, callback),
        1000
      );
    } else {
      throw new Error("Failed to authorize, pleasae try again");
    }
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  }
};

export const authorize = async (context: vscode.ExtensionContext) => {
  try {
    const response = await fetch(`${apiUrlOrigin}/authorize`, {
      method: "POST",
    });
    const { redirect_url: redirectUrl, session_id: sessionId } =
      await response.json();
    if (!redirectUrl || !sessionId)
      throw new Error("Invalid response from the server");

    vscode.env.openExternal(vscode.Uri.parse(redirectUrl));
    context.secrets.store("sessionId", sessionId);

    pollAuthorizationStatusTimeoutId = setTimeout(
      () =>
        pollAuthorizationStatus(context, () =>
          setIsFileTreeOpen(context, true)
        ),
      1000
    );
    setTimeout(
      () => {
        clearTimeout(pollAuthorizationStatusTimeoutId);
      },
      1000 * 60 * 10
    ); // 10 minutes
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  }
};
