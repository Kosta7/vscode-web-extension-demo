import * as vscode from "vscode";

import { treeDataProvider, treeView } from "../providers";
import { KEYS, FILE_CONTENT_URI_SCHEME } from "../utilities/constants";

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

    vscode.workspace.textDocuments.forEach(async (document) => {
      if (document.uri.scheme === FILE_CONTENT_URI_SCHEME) {
        await vscode.window.showTextDocument(document, {
          preview: false,
          viewColumn: vscode.ViewColumn.One,
          preserveFocus: false,
        });
        vscode.commands.executeCommand("workbench.action.closeActiveEditor");
      }
    });
  }
};
