import * as vscode from "vscode";

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  constructor(
    private githubRepoUrl: string,
    private context: vscode.ExtensionContext
  ) {}

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    try {
      const githubUrlRegex =
        /^(https?:\/\/)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/?$/;
      const isGithubUrlValid = githubUrlRegex.test(this.githubRepoUrl);

      if (!this.githubRepoUrl) {
        throw new Error("Please enter a GitHub repository URL");
      } else if (!isGithubUrlValid) {
        throw new Error("Invalid GitHub repository URL");
      }

      const isRootItem = !element;
      if (isRootItem) {
        const [, , repoOwner, repoName] =
          this.githubRepoUrl.match(githubUrlRegex) || [];
        if (!repoOwner || !repoName)
          throw new Error("Invalid GitHub repository URL");

        const sessionId = await this.context.secrets.get("sessionId");
        const apiUrlOrigin = this.context.globalState.get("apiUrlOrigin");
        const response = await fetch(
          `${apiUrlOrigin}/repos/${repoOwner}/${repoName}/files`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${sessionId}`,
            },
          }
        );
        const sha = await response.text();

        vscode.window.showInformationMessage(sha);

        return [];

        // return data.map(
        //   (item: any) =>
        //     new TreeItem(
        //       item.name,
        //       item.version,
        //       vscode.TreeItemCollapsibleState.None
        //     )
        // );
      } else {
        return []; // todo
      }
    } catch (err) {
      vscode.window.showErrorMessage(String(err));
      return [];
    }
  }

  private async pathExists(p: string): Promise<boolean> {
    try {
      // try fetching the repo
    } catch (err) {
      return false;
    }
    return true;
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  extensionPath = vscode.extensions.getExtension("demo")?.extensionPath;

  iconPath = {
    light: vscode.Uri.joinPath(
      vscode.Uri.file(this.extensionPath || ""),
      "..",
      "..",
      "resources",
      "light",
      "dependency.svg"
    ).fsPath,
    dark: vscode.Uri.joinPath(
      vscode.Uri.file(this.extensionPath || ""),
      "..",
      "..",
      "resources",
      "dark",
      "dependency.svg"
    ).fsPath,
  };
}
