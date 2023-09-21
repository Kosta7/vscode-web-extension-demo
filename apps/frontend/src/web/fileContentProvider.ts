import * as vscode from "vscode";

export class FileContentProvider implements vscode.TextDocumentContentProvider {
  onDidChange?: vscode.Event<vscode.Uri>;

  constructor(private context: vscode.ExtensionContext) {}

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    if (uri.scheme === "github-files") {
      try {
        const apiUrlOrigin = this.context.globalState.get("apiUrlOrigin");
        const repoId = this.context.globalState.get("repoId");
        const path = String(this.context.globalState.get("path")).replace(
          /^\//,
          ""
        );
        const sessionId = await this.context.secrets.get("sessionId");
        const response = await fetch(
          `${apiUrlOrigin}/repos/${repoId}/files/${path}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${sessionId}`,
            },
          }
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
