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
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <input
                id="githubRepoUrl"
                type="text"
                placeholder="Paste a GitHub Repo URL"
                style="height:24px; box-sizing:border-box; font-size:13px; background-color:rgba(255,255,255,70%); border:1px solid #cecece; font-family:-apple-system,BlinkMacSystemFont,sans-serif;"
            >
            <button
                id="authorizeAndFetch"
                style="height:24px; border:none; color:white; cursor:pointer; background-color:rgba(0,0,0,50%); border:1px solid rgba(100,100,100,50%); font-family:-apple-system,BlinkMacSystemFont,sans-serif;"
            >
                Authorize & Fetch
            </button>
        </div>

        <script defer nonce="jZaLVeSrOifiXOkJ">
            const vscode = acquireVsCodeApi();
            const button = document.getElementById('authorizeAndFetch');
            const input = document.getElementById('githubRepoUrl');

            const authorizeAndFetch = () => {
                vscode.postMessage({
                    command: 'authorizeAndFetch',
                    githubRepoUrl: input.value
                });
            }
            button.addEventListener('click', authorizeAndFetch);
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') authorizeAndFetch();
            });
            document.addEventListener('DOMContentLoaded', function() {
                input.focus();
            });
        </script>
    </body>
    </html>`;
  }
}
