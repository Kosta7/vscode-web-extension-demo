import * as vscode from "vscode";

import { TreeDataProvider } from "./treeDataProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("The extension is now active in the web extension host!");

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
      ).then((response) => {
        const redirectUrl = response.headers.get("redirect_url");
        const sessionId = response.headers.get("session_id");

        console.log("redirectUrl, sessionId", redirectUrl, sessionId, response);

        if (redirectUrl && sessionId) {
          vscode.env.openExternal(vscode.Uri.parse(redirectUrl));
          context.secrets.store("sessionId", sessionId);
        }
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
