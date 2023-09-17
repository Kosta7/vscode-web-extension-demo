import * as vscode from "vscode";

export class GithubUrlInputViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "authorizeAndFetch":
          try {
            const { githubRepoUrl } = message;
            if (!githubRepoUrl)
              throw new Error("Please enter a GitHub repository URL");

            const githubUrlRegex =
              /^(https?:\/\/)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/?$/;
            const isGithubUrlValid = githubUrlRegex.test(githubRepoUrl);
            if (!isGithubUrlValid)
              throw new Error("Invalid GitHub repository URL");

            vscode.commands.executeCommand(
              "authorizeAndFetch",
              message.githubRepoUrl
            );
          } catch (error) {
            vscode.window.showErrorMessage(String(error));
          } finally {
            break;
          }
      }
    }, undefined);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-jZaLVeSrOifiXOkJ'">
        <title>Authorize & Fetch</title>
    </head>
    <body>
        <input id="githubRepoUrl" type="text" placeholder="GitHub repo URL...">
        <button id="authorizeAndFetch">Authorize & Fetch</button>

        <script defer nonce="jZaLVeSrOifiXOkJ">
            const vscode = acquireVsCodeApi();
            const button = document.getElementById('authorizeAndFetch');
            const input = document.getElementById('githubRepoUrl');

            button.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'authorizeAndFetch',
                    githubRepoUrl: input.value
                });
            });
        </script>
    </body>
    </html>`;
  }
}
