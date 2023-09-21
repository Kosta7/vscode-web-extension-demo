import * as vscode from "vscode";

import { activateProviders, deactivateProviders } from "./providers";
import { activateCommands, deactivateCommands } from "./commands";
import { setIsFileTreeOpen } from "./commands/setIsFileTreeOpen";

export function activate(context: vscode.ExtensionContext) {
  activateProviders(context);
  activateCommands(context);

  setIsFileTreeOpen(context, false);
}

export function deactivate() {
  deactivateProviders();
  deactivateCommands();
}
