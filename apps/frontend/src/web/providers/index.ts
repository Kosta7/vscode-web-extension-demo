import * as vscode from "vscode";

import { FileContentProvider } from "./fileContentProvider";
import { GithubUrlInputViewProvider } from "./githubUrlInputViewProvider";
import { TreeDataProvider, TreeItem } from "./treeDataProvider";
export {
  FileContentProvider,
  GithubUrlInputViewProvider,
  TreeDataProvider,
  TreeItem,
};

export const githubUrlInputViewProvider = new GithubUrlInputViewProvider();
export const githubUrlInputView = vscode.window.registerWebviewViewProvider(
  "githubUrlInput",
  githubUrlInputViewProvider
);

export const treeDataProvider = new TreeDataProvider();
export const treeView = vscode.window.createTreeView("fileTree", {
  treeDataProvider,
  showCollapseAll: true,
});

export const fileContentProvider = new FileContentProvider();

let onDidChangeActiveTextEditorListener: vscode.Disposable;

export const activateProviders = (context: vscode.ExtensionContext) => {
  githubUrlInputViewProvider.setContext(context);
  treeDataProvider.setContext(context);
  fileContentProvider.setContext(context);

  context.subscriptions.push(githubUrlInputView, treeView);
  vscode.workspace.registerTextDocumentContentProvider(
    "github-files",
    fileContentProvider
  );

  onDidChangeActiveTextEditorListener =
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) return;

      const filePath = editor.document.uri.path;
      const treeItem = treeDataProvider.getTreeItemByPath(filePath);
      treeItem && treeView.reveal(treeItem);
    });
};

export const deactivateProviders = () => {
  githubUrlInputView.dispose();
  treeView.dispose();
  onDidChangeActiveTextEditorListener.dispose();
};
