import * as vscode from "vscode";

import { githubUrlInputViewProvider } from "../providers";

export const setIsAuthorized = (
  context: vscode.ExtensionContext,
  isAuthorized: boolean
) => {
  context.globalState.update("isAuthorized", isAuthorized);
  githubUrlInputViewProvider.setIsUserAuthorized(isAuthorized);
  vscode.commands.executeCommand("setContext", "isAuthorized", isAuthorized);
};

export const propagateIsAuthorized = (context: vscode.ExtensionContext) => {
  const isAuthorized = context.globalState.get("isAuthorized");
  setIsAuthorized(context, !!isAuthorized);
};
