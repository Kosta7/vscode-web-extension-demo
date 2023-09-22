import * as vscode from "vscode";

import { githubUrlInputViewProvider } from "../providers";
import { KEYS } from "../utilities/constants";

export const setIsAuthorized = (
  context: vscode.ExtensionContext,
  isAuthorized: boolean
) => {
  context.globalState.update(KEYS.IS_AUTHORIZED, isAuthorized);
  githubUrlInputViewProvider.setIsUserAuthorized(isAuthorized);
  vscode.commands.executeCommand(
    KEYS.SET_CONTEXT,
    KEYS.IS_AUTHORIZED,
    isAuthorized
  );
};

export const propagateIsAuthorized = (context: vscode.ExtensionContext) => {
  const isAuthorized = context.globalState.get(KEYS.IS_AUTHORIZED);
  setIsAuthorized(context, !!isAuthorized);
};
