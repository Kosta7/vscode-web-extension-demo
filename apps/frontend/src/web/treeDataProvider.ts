import * as vscode from "vscode";

type TreeData = {
  path: string;
  sha: string;
  type: string;
  [key: string]: any;
}[];

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private repo: string = "";
  private repoName: string = "";
  private treeData: TreeData = [];

  constructor(
    repo: string,
    private context: vscode.ExtensionContext
  ) {
    this.repo = repo;
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    const getTreeItems = (path: string) =>
      this.treeData
        .filter((item) => item.path.startsWith(path))
        .reduce((acc: TreeItem[], item) => {
          const label = item.path
            .replace(path, "")
            .replace(/^\//, "") // remove a leading slash
            .split("/")[0];

          if (!label || acc.find((item) => item.label === label)) return acc;

          return [
            ...acc,
            new TreeItem(
              label,
              item.path,
              item.type === "tree"
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
            ),
          ];
        }, [])
        .sort((a, b) => a.label.localeCompare(b.label));

    try {
      if (!this.repo) {
        throw new Error("Error getting repository name or owner");
      }

      const isRootItem = !element;
      if (isRootItem) {
        const getTreeData = async () => {
          const cachedTreeData:
            | { treeData: TreeData; expiryDate: Date }
            | undefined = this.context.globalState.get(this.repo);
          if (cachedTreeData) {
            const isExpired =
              new Date().getTime() >
              new Date(cachedTreeData.expiryDate).getTime();
            if (isExpired) {
              await this.context.globalState.update(
                this.githubRepoUrl,
                undefined
              );
            } else {
              this.treeData = cachedTreeData.treeData;
              return;
            }
          }

          const apiUrlOrigin = this.context.globalState.get("apiUrlOrigin");
          const response = await fetch(
            `${apiUrlOrigin}/repos/${this.repo}/files`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${sessionId}`,
              },
            }
          );
          const {
            tree: treeData,
          }: {
            tree: TreeData;
          } = await response.json();

          await this.context.globalState.update(this.repo, {
            treeData,
            expiryDate: new Date().getTime() + 1000 * 60 * 60 * 24, // 24h from now
          });
          this.treeData = treeData;
        };
        await getTreeData();

        return getTreeItems("");
      } else {
        return getTreeItems(element.getPath());
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
    private readonly path: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.path = path;
  }

  getPath(): string {
    return this.path;
  }

  // extensionPath = vscode.extensions.getExtension("demo")?.extensionPath;

  // iconPath = {
  //   light: vscode.Uri.joinPath(
  //     vscode.Uri.file(this.extensionPath || ""),
  //     "..",
  //     "..",
  //     "resources",
  //     "light",
  //     "dependency.svg"
  //   ).fsPath,
  //   dark: vscode.Uri.joinPath(
  //     vscode.Uri.file(this.extensionPath || ""),
  //     "..",
  //     "..",
  //     "resources",
  //     "dark",
  //     "dependency.svg"
  //   ).fsPath,
  // };
}
