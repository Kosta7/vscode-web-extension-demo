import * as vscode from "vscode";

import { treeDataProvider, treeView } from "../providers";
import { KEYS } from "../utilities/constants";

export const setIsFileTreeOpen = (
  context: vscode.ExtensionContext,
  isFileTreeOpen: boolean
) => {
  if (isFileTreeOpen) {
    vscode.commands.executeCommand(
      KEYS.SET_CONTEXT,
      KEYS.IS_FILE_TREE_OPEN,
      true
    );
    treeDataProvider.refresh();
    treeView.title = context.globalState.get(KEYS.REPO_ID);
  } else {
    vscode.commands.executeCommand(
      KEYS.SET_CONTEXT,
      KEYS.IS_FILE_TREE_OPEN,
      false
    );
    treeDataProvider.empty();
    treeView.title = "";
  }
};
