import * as vscode from "vscode";

import { TreeItem, treeView } from "../providers";

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
      preview: true,
      viewColumn: vscode.ViewColumn.One,
      preserveFocus: false,
    });

    await treeView.reveal(treeItem, {
      select: true,
      focus: false,
    });
  } catch (error) {
    vscode.window.showErrorMessage(String(error));
  }
};
