import * as vscode from "vscode";

import { treeDataProvider, treeView } from "../providers";

export const setIsFileTreeOpen = (
  context: vscode.ExtensionContext,
  isFileTreeOpen: boolean
) => {
  if (isFileTreeOpen) {
    vscode.commands.executeCommand("setContext", "isFileTreeOpen", true);
    treeDataProvider.refresh();
    treeView.title = context.globalState.get("repoId");
  } else {
    vscode.commands.executeCommand("setContext", "isFileTreeOpen", false);
    treeDataProvider.empty();
    treeView.title = "";
  }
};
