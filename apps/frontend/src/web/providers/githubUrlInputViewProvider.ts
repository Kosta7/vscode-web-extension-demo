import * as vscode from "vscode";

import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { KEYS, COMMANDS } from "../utilities/constants";

export class GithubUrlInputViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "myWebviewView";

  private _view?: vscode.WebviewView;

  constructor(private _extensionContext?: vscode.ExtensionContext) {}

  setContext(context: vscode.ExtensionContext) {
    this._extensionContext = context;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    if (!this._extensionContext) {
      throw new Error("No extension context in a provider");
    }

    this._view = webviewView;

    this._view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(
          this._extensionContext.extensionUri,
          "webview-ui",
          "build",
          "assets"
        ),
      ],
    };

    this._view.webview.html = this._getHtmlForWebview(
      webviewView.webview,
      context
    );

    this._view.webview.onDidReceiveMessage(({ command, payload, error }) => {
      switch (command) {
        case "submit-repo":
          if (error) vscode.window.showErrorMessage(error);
          else
            vscode.commands.executeCommand(
              COMMANDS.AUTHORIZE_AND_FETCH,
              payload
            );
          break;
        case "unauthorize":
          vscode.commands.executeCommand(COMMANDS.UNAUTHORIZE);
          break;
      }
    });
  }

  public setIsUserAuthorized(isAuthorized: boolean): void {
    if (!this._view) return;

    this._view.webview.postMessage({
      command: "is-authorized",
      payload: isAuthorized,
    });
  }

  private _getHtmlForWebview(
    webview: vscode.Webview,
    context: vscode.WebviewViewResolveContext
  ): string {
    if (!this._extensionContext) {
      throw new Error("No extension context in a provider");
    }

    const scriptUri = getUri(webview, this._extensionContext.extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
    ]);
    const stylesUri = getUri(webview, this._extensionContext.extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.css",
    ]);

    const nonce = getNonce();

    const isAuthorized = !!this._extensionContext.globalState.get(
      KEYS.IS_AUTHORIZED
    );

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <meta id="is-authorized" is-authorized=${isAuthorized} />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
