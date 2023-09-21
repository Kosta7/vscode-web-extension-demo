import * as vscode from "vscode";

import { authorize } from "./authorize";
import { unauthorize } from "./unauthorize";
import { setIsFileTreeOpen } from "./setIsFileTreeOpen";
import { openFile } from "./openFile";

let authorizeAndFetchCommand: vscode.Disposable;
let unauthorizeCommand: vscode.Disposable;
let goToGithubUrlInputCommand: vscode.Disposable;
let openFileCommand: vscode.Disposable;

export const activateCommands = (context: vscode.ExtensionContext) => {
  authorizeAndFetchCommand = vscode.commands.registerCommand(
    "authorizeAndFetch",
    async (repoId: string) => {
      context.globalState.update("repoId", repoId);

      if (context.globalState.get("isAuthorized"))
        setIsFileTreeOpen(context, true);
      else authorize(context);
    }
  );

  unauthorizeCommand = vscode.commands.registerCommand("unauthorize", () =>
    unauthorize(context)
  );

  goToGithubUrlInputCommand = vscode.commands.registerCommand(
    "goToGithubUrlInput",
    () => setIsFileTreeOpen(context, false)
  );

  openFileCommand = vscode.commands.registerCommand(
    "openFile",
    async (treeItem) => openFile(context, treeItem)
  );

  context.subscriptions.push(
    authorizeAndFetchCommand,
    goToGithubUrlInputCommand,
    openFileCommand,
    unauthorizeCommand
  );
};

export const deactivateCommands = () => {
  authorizeAndFetchCommand.dispose();
  goToGithubUrlInputCommand.dispose();
  openFileCommand.dispose();
  unauthorizeCommand.dispose();
};
