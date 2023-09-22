import * as vscode from "vscode";

import { TreeItem } from "../providers";
import { KEYS, FILE_CONTENT_URI_SCHEME } from "../utilities/constants";

export const openFile = async (
  context: vscode.ExtensionContext,
  treeItem: TreeItem
) => {
  try {
    const path = treeItem.getPath();
    await context.globalState.update(KEYS.PATH, path); // passing to FileContentProvider manually since .openTextDocument() lowercases file paths

    const uri = vscode.Uri.parse(`${FILE_CONTENT_URI_SCHEME}://${path}`);
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
