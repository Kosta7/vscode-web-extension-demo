import * as vscode from "vscode";

import { TreeItem } from "../providers";

export const openFile = async (
  context: vscode.ExtensionContext,
  treeItem: TreeItem
) => {
  try {
    const path = treeItem.getPath();
    await context.globalState.update("path", path); // passing to FileContentProvider manually since .openTextDocument() lowercases file paths

    const uri = vscode.Uri.parse(`github-files://${path}`);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, {
      preview: false,
      viewColumn: vscode.ViewColumn.One,
      preserveFocus: false,
    });
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  }
};
