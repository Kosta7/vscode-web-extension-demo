import * as vscode from "vscode";

import { TreeDataProvider } from "./treeDataProvider";

export function activate(context: vscode.ExtensionContext) {
  const isDevelopment = vscode.env.machineId === "someValue.machineId";
  const apiUrlOrigin = isDevelopment
    ? "http://localhost:8080"
    : "https://vscode-web-extension-demo-backend.vercel.app";
  context.globalState.update("apiUrlOrigin", apiUrlOrigin);

  const authorizeAndFetchButton = vscode.commands.registerCommand(
    "demo.authorizeAndFetch",
    async () => {
      let checkAuthorizationIntervalId: NodeJS.Timeout;
      const checkAuthorization = async (callback: () => void) => {
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
            clearInterval(checkAuthorizationIntervalId);
            context.globalState.update("authorized", true);
            callback();
          }
        } catch (error) {
          console.error(error);
        }
      };

      const fetchRepositoryFiles = () => {
        const treeView = vscode.window.createTreeView("demo.explorer", {
          treeDataProvider: new TreeDataProvider(
            "https://github.com/kosta7/vscode-web-extension-demo",
            context
          ),
          showCollapseAll: true,
        });

        context.subscriptions.push(treeView);
      };

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

        checkAuthorizationIntervalId = setInterval(
          () => checkAuthorization(fetchRepositoryFiles),
          1000
        );
      } catch (error) {
        vscode.window.showErrorMessage(String(error));
      }
    }
  );

  // const treeView = vscode.window.createTreeView("demo.explorer", {
  //   treeDataProvider: new TreeDataProvider("", context),
  //   showCollapseAll: true,
  // });

  context.subscriptions.push(
    authorizeAndFetchButton
    // treeView
  );
}

export function deactivate() {}
