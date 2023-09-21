import * as vscode from "vscode";

import { TreeDataProvider, TreeItem } from "./treeDataProvider";
import { GithubUrlInputViewProvider } from "./githubUrlInputViewProvider";
import { FileContentProvider } from "./fileContentProvider";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage(
    "Hello World from vscode-web-extension!"
  );

  const isDevelopment = vscode.env.machineId === "someValue.machineId";
  const apiUrlOrigin = isDevelopment
    ? "http://localhost:8080"
    : "https://vscode-web-extension-demo-backend.vercel.app";
  context.globalState.update("apiUrlOrigin", apiUrlOrigin);

  const githubUrlInputViewProvider = new GithubUrlInputViewProvider(context);
  const githubUrlInputView = vscode.window.registerWebviewViewProvider(
    "githubUrlInput",
    githubUrlInputViewProvider
  );

  const treeDataProvider = new TreeDataProvider(context);
  const treeView = vscode.window.createTreeView("fileTree", {
    treeDataProvider,
    showCollapseAll: true,
  });

  const authorizeAndFetchCommand = vscode.commands.registerCommand(
    "authorizeAndFetch",
    async (repoId: string) => {
      context.globalState.update("repoId", repoId);

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
            context.globalState.update("isAuthorized", true);
            vscode.commands.executeCommand("setContext", "isAuthorized", true);
            callback();
            clearInterval(pollAuthorizationStatusIntervalId);
          }
        } catch (error) {
          vscode.window.showErrorMessage(String(error));
        }
      };

      const showRepo = () => {
        vscode.commands.executeCommand("setContext", "showFileTree", true);
        treeDataProvider.refresh();
        context.subscriptions.push(treeView);
      };

      const authorize = async () => {
        try {
          const authorizationResponse = await fetch(
            `${apiUrlOrigin}/authorize`,
            {
              method: "POST",
            }
          );
          const { redirect_url: redirectUrl, session_id: sessionId } =
            await authorizationResponse.json();
          if (!redirectUrl || !sessionId)
            throw new Error("Invalid response from the server");

          vscode.env.openExternal(vscode.Uri.parse(redirectUrl));
          context.secrets.store("sessionId", sessionId);

          pollAuthorizationStatusIntervalId = setInterval(
            () => pollAuthorizationStatus(showRepo),
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

      if (context.globalState.get("isAuthorized")) {
        showRepo();
      } else {
        authorize();
      }
    }
  );

  const goToGithubUrlInputCommand = vscode.commands.registerCommand(
    "goToGithubUrlInput",
    () => {
      vscode.commands.executeCommand("setContext", "showFileTree", false);
    }
  );

  const unauthorizeCommand = vscode.commands.registerCommand(
    "unauthorize",
    async () => {
      const sessionId = await context.secrets.get("sessionId");
      if (!sessionId) return;

      try {
        await fetch(`${apiUrlOrigin}/unauthorize`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });
      } catch (error) {
        vscode.window.showErrorMessage(String(error));
      } finally {
        context.globalState.update("isAuthorized", false);
        githubUrlInputViewProvider.setIsUserAuthorized(false);
        vscode.commands.executeCommand("setContext", "showFileTree", false);
        vscode.commands.executeCommand("setContext", "isAuthorized", false);
        context.secrets.delete("sessionId");
      }
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
    openFileCommand,
    unauthorizeCommand
  );

  vscode.commands.executeCommand("setContext", "showGithubUrlInput", true);
  vscode.commands.executeCommand("setContext", "showFileTree", false);
}

export function deactivate() {}
