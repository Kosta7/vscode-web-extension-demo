import * as vscode from "vscode";

import { TreeDataProvider } from "./treeDataProvider";
import { GithubUrlInputViewProvider } from "./githubUrlInputViewProvider";
import { HelloWorldPanel } from "./panels/helloWorldPanel";

export function activate(context: vscode.ExtensionContext) {
  const isDevelopment = vscode.env.machineId === "someValue.machineId";
  const apiUrlOrigin = isDevelopment
    ? "http://localhost:8080"
    : "https://vscode-web-extension-demo-backend.vercel.app";
  context.globalState.update("apiUrlOrigin", apiUrlOrigin);

  const showHelloWorldCommand = vscode.commands.registerCommand(
    "hello-world.showHelloWorld",
    () => {
      HelloWorldPanel.render(context.extensionUri);
    }
  );

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);

  const githubUrlInputView = vscode.window.registerWebviewViewProvider(
    "githubUrlInput",
    new GithubUrlInputViewProvider(context.extensionUri)
  );

  const authorizeAndFetchCommand = vscode.commands.registerCommand(
    "authorizeAndFetch",
    async (githubRepoUrl: string) => {
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
          console.error(error);
        }
      };

      const fetchRepositoryFiles = () => {
        const treeView = vscode.window.createTreeView("fileTree", {
          treeDataProvider: new TreeDataProvider(githubRepoUrl, context),
          showCollapseAll: true,
        });

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

      HelloWorldPanel.render(context.extensionUri); // can it be stored in the context or something? to not rerender each time
    }
  );

  vscode.commands.executeCommand("setContext", "showGithubUrlInput", true);
  vscode.commands.executeCommand("setContext", "showFileTree", false);

  context.subscriptions.push(
    githubUrlInputView,
    authorizeAndFetchCommand,
    goToGithubUrlInputCommand
  );
}

export function deactivate() {}
