import * as vscode from "vscode";

import { authorizedFetch } from "../utilities/authorizedFetch";
import { apiUrlOrigin, LEADING_SLASH } from "../utilities/constants";

export class FileContentProvider implements vscode.TextDocumentContentProvider {
  onDidChange?: vscode.Event<vscode.Uri>;

  constructor(private _extensionContext?: vscode.ExtensionContext) {}

  setContext(context: vscode.ExtensionContext) {
    this._extensionContext = context;
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    if (!this._extensionContext) {
      throw new Error("No extension context in a provider");
    }

    if (uri.scheme === "github-files") {
      try {
        const repoId = this._extensionContext.globalState.get("repoId");
        const path = String(
          this._extensionContext.globalState.get("path")
        ).replace(LEADING_SLASH, "");
        const sessionId = await this._extensionContext.secrets.get("sessionId");
        const response = await authorizedFetch(
          `${apiUrlOrigin}/repos/${repoId}/files/${path}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${sessionId}`,
            },
          },
          this._extensionContext
        );
        if (!response.ok)
          throw new Error(
            "Failed to get file content. Status: " + response.status
          );
        const content = await response.text();
        if (!content) throw new Error("Failed to get file content");

        return content;
      } catch (error) {
        vscode.window.showErrorMessage(String(error));
      }
    }
    return "";
  }
}
