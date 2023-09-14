import * as vscode from "vscode";

import { TreeDataProvider } from "./treeDataProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("The extension is now active in the web extension host!");
  vscode.window.showInformationMessage("The extension is now active!");

  const isDevelopment = vscode.env.machineId === "someValue.machineId";
  const apiOrigin = isDevelopment
    ? "http://localhost:8080"
    : "https://vscode-web-extension-demo-backend.vercel.app";

  let pollingIntervalId: NodeJS.Timeout;

  const authorizeAndFetchButton = vscode.commands.registerCommand(
    "demo.authorizeAndFetch",
    () => {
      const poll = async () => {
        try {
          const sessionId = await context.secrets.get("sessionId");
          if (!sessionId) return;

          const response = await fetch(`${apiOrigin}/check-authorization`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${sessionId}`,
            },
          });
          if (response.status === 200) {
            clearInterval(pollingIntervalId);
          }
        } catch (error) {
          console.error(error);
        }
      };

      fetch(`${apiOrigin}/authorize`, {
        method: "POST",
      })
        .then((response) => response.json())
        .then(({ redirect_url: redirectUrl, session_id: sessionId }) => {
          vscode.window.showInformationMessage(
            redirectUrl || "No redirect URL"
          );
          vscode.window.showInformationMessage(sessionId || "No session ID");

          if (redirectUrl && sessionId) {
            vscode.env.openExternal(vscode.Uri.parse(redirectUrl));
            context.secrets.store("sessionId", sessionId);

            pollingIntervalId = setInterval(poll, 1000);
          }
        })
        .catch((err) => {
          vscode.window.showInformationMessage(`catch error: ${err}`);
        });
    }
  );

  const treeView = vscode.window.createTreeView("demo.explorer", {
    treeDataProvider: new TreeDataProvider(""),
    showCollapseAll: true,
  });

  context.subscriptions.push(authorizeAndFetchButton, treeView);
}

export function deactivate() {}
