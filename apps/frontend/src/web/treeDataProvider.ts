import * as vscode from "vscode";

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  constructor(private githubRepoUrl: string) {}

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!this.githubRepoUrl) {
      vscode.window.showInformationMessage("No GitHub repository URL found");
      return Promise.resolve([]);
    }

    if (element) {
      return [];
    } else {
      return []; // for root node
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
