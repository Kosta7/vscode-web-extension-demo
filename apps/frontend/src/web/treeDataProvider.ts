import * as vscode from "vscode";

type TreeData = {
  path: string;
  sha: string;
  type: string;
  [key: string]: any;
}[];

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private treeData: TreeData = [];

  constructor(
    private githubRepoUrl: string,
    private context: vscode.ExtensionContext
  ) {}

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
        const getTreeData = async () => {
          const [, , repoOwner, repoName] =
            this.githubRepoUrl.match(githubUrlRegex) || [];
          if (!repoOwner || !repoName)
            throw new Error("Invalid GitHub repository URL");

          const cachedTreeData:
            | { treeData: TreeData; expiryDate: Date }
            | undefined = this.context.globalState.get(this.githubRepoUrl);
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
            `${apiUrlOrigin}/repos/${repoOwner}/${repoName}/files`,
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

          await this.context.globalState.update(this.githubRepoUrl, {
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
