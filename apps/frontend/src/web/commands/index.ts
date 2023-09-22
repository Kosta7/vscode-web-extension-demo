import * as vscode from "vscode";

import { authorize } from "./authorize";
import { unauthorize } from "./unauthorize";
import { setIsFileTreeOpen } from "./setIsFileTreeOpen";
import { openFile } from "./openFile";
import { COMMANDS, KEYS } from "../utilities/constants";

let authorizeAndFetchCommand: vscode.Disposable;
let unauthorizeCommand: vscode.Disposable;
let goToGithubUrlInputCommand: vscode.Disposable;
let openFileCommand: vscode.Disposable;

export const activateCommands = (context: vscode.ExtensionContext) => {
  authorizeAndFetchCommand = vscode.commands.registerCommand(
    COMMANDS.AUTHORIZE_AND_FETCH,
    async (repoId: string) => {
      context.globalState.update(KEYS.REPO_ID, repoId);

      if (context.globalState.get(KEYS.IS_AUTHORIZED))
        setIsFileTreeOpen(context, true);
      else authorize(context);
    }
  );

  unauthorizeCommand = vscode.commands.registerCommand(
    COMMANDS.UNAUTHORIZE,
    () => unauthorize(context)
  );

  goToGithubUrlInputCommand = vscode.commands.registerCommand(
    COMMANDS.GO_TO_GITHUB_URL_INPUT,
    () => setIsFileTreeOpen(context, false)
  );

  openFileCommand = vscode.commands.registerCommand(
    COMMANDS.OPEN_FILE,
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
