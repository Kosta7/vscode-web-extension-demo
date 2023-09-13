import * as vscode from "vscode";

import { TreeDataProvider } from "./treeDataProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("The extension is now active in the web extension host!");
  vscode.window.showInformationMessage("The extension is now active!");

  const isDevelopment = vscode.env.machineId === "someValue.machineId";

  const authorizeAndFetchButton = vscode.commands.registerCommand(
    "demo.authorizeAndFetch",
    () => {
      fetch(
        `${
          isDevelopment
            ? "http://localhost:8080"
            : "https://vscode-web-extension-demo-backend.vercel.app"
        }/authorize`,
        {
          method: "POST",
        }
      )
        .then((response) => response.json())
        .then(({ redirect_url: redirectUrl, session_id: sessionId }) => {
          vscode.window.showInformationMessage(
            redirectUrl || "No redirect URL"
          );
          vscode.window.showInformationMessage(sessionId || "No session ID");

          if (redirectUrl && sessionId) {
            vscode.env.openExternal(vscode.Uri.parse(redirectUrl));
            context.secrets.store("sessionId", sessionId);
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
