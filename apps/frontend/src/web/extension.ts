import * as vscode from "vscode";

import { TreeDataProvider, TreeItem } from "./treeDataProvider";
import { GithubUrlInputViewProvider } from "./githubUrlInputViewProvider";
import { FileContentProvider } from "./fileContentProvider";

export function activate(context: vscode.ExtensionContext) {
  const isDevelopment = vscode.env.machineId === "someValue.machineId";
  const apiUrlOrigin = isDevelopment
    ? "http://localhost:8080"
    : "https://vscode-web-extension-demo-backend.vercel.app";
  context.globalState.update("apiUrlOrigin", apiUrlOrigin);

  const githubUrlInputView = vscode.window.registerWebviewViewProvider(
    "githubUrlInput",
    new GithubUrlInputViewProvider(context.extensionUri)
  );

  const treeView = vscode.window.createTreeView("fileTree", {
    treeDataProvider: new TreeDataProvider(context),
    showCollapseAll: true,
  });

  const authorizeAndFetchCommand = vscode.commands.registerCommand(
    "authorizeAndFetch",
    async (repo: string) => {
      context.globalState.update("repo", repo);
      let pollAuthorizationStatusIntervalId: NodeJS.Timeout;
      const pollAuthorizationStatus = async (callback: () => void) => {
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
            clearInterval(pollAuthorizationStatusIntervalId);
            context.globalState.update("authorized", true);
            callback();
          }
        } catch (error) {
          vscode.window.showErrorMessage(String(error));
        }
      };

      const fetchRepositoryFiles = () => {
        vscode.commands.executeCommand("setContext", "showFileTree", true);
        vscode.commands.executeCommand(
          "setContext",
          "showGithubUrlInput",
          false
        );

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

        pollAuthorizationStatusIntervalId = setInterval(
          () => pollAuthorizationStatus(fetchRepositoryFiles),
          1000
        );
      } catch (error) {
        vscode.window.showErrorMessage(String(error));
      }
    }
  );

  // const treeView = vscode.window.createTreeView("fileTree", { // to not rerender each time

  const goToGithubUrlInputCommand = vscode.commands.registerCommand(
    "goToGithubUrlInput",
    () => {
      vscode.commands.executeCommand("setContext", "showGithubUrlInput", true);
      vscode.commands.executeCommand("setContext", "showFileTree", false);
    }
  );

  const openFileCommand = vscode.commands.registerCommand(
    "openFile",
    async (treeItem: TreeItem) => {
      const path = treeItem.getPath();
      await context.globalState.update("path", path); // passing to FileContentProvider manually since .openTextDocument() lowercases file paths
      const uri = vscode.Uri.parse(`github-files://${path}`);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document, {
        preview: true,
        viewColumn: vscode.ViewColumn.One,
        preserveFocus: false,
      });
      await treeView.reveal(treeItem, {
        select: true,
        focus: false,
      });
    }
  );

  const fileContentProvider = new FileContentProvider(context);
  vscode.workspace.registerTextDocumentContentProvider(
    "github-files",
    fileContentProvider
  );

  context.subscriptions.push(
    githubUrlInputView,
    authorizeAndFetchCommand,
    goToGithubUrlInputCommand,
    openFileCommand
  );

  vscode.commands.executeCommand("setContext", "showGithubUrlInput", true);
  vscode.commands.executeCommand("setContext", "showFileTree", false);
}

export function deactivate() {}
