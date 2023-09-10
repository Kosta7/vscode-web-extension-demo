import * as vscode from "vscode";

import { TreeDataProvider } from "./treeDataProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("The extension is now active in the web extension host!");

  const authorizeAndFetchButton = vscode.commands.registerCommand(
    "demo.authorizeAndFetch",
    () => {}
  );

  const treeView = vscode.window.createTreeView("demo.explorer", {
    treeDataProvider: new TreeDataProvider(""),
    showCollapseAll: true,
  });

  context.subscriptions.push(authorizeAndFetchButton, treeView);
}

export function deactivate() {}
