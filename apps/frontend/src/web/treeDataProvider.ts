import * as vscode from "vscode";

type TreeData = {
  path: string;
  sha: string;
  type: string;
  [key: string]: any;
}[];

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private treeData: TreeData = [];

  constructor(private context: vscode.ExtensionContext) {}

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  getParent(element: TreeItem): TreeItem | null {
    return element.parent || null;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    try {
      const repo = this.context.globalState.get("repo") as string;
      if (!repo) throw new Error("Error getting repository name or owner");

      const getTreeItems = (parentPath: string) =>
        this.treeData
          .filter((item) => item.path.startsWith(parentPath))
          .reduce((acc: TreeItem[], item) => {
            const label = item.path
              .replace(parentPath, "")
              .replace(/^\//, "") // remove a leading slash
              .split("/")[0];

            const itemPath = "/" + item.path;

            if (!label || acc.find((item) => item.label === label)) return acc;

            return [
              ...acc,
              new TreeItem(label, itemPath, item.type == "tree", element),
            ];
          }, [])
          .sort((a, b) => a.label.localeCompare(b.label));

      const isRootItem = !element;
      if (isRootItem) {
        const getTreeData = async () => {
          const cachedTreeData:
            | { treeData: TreeData; expiryDate: Date }
            | undefined = this.context.globalState.get(repo);
          if (cachedTreeData) {
            const isExpired =
              new Date().getTime() >
              new Date(cachedTreeData.expiryDate).getTime();
            if (isExpired) {
              await this.context.globalState.update(repo, undefined);
            } else {
              this.treeData = cachedTreeData.treeData;
              return;
            }
          }

          const sessionId = await this.context.secrets.get("sessionId");
          const apiUrlOrigin = this.context.globalState.get("apiUrlOrigin");
          const response = await fetch(`${apiUrlOrigin}/repos/${repo}/files`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${sessionId}`,
            },
          });
          const {
            tree: treeData,
          }: {
            tree: TreeData;
          } = await response.json();

          await this.context.globalState.update(repo, {
            treeData,
            expiryDate: new Date().getTime() + 1000 * 60 * 60 * 24, // 24h from now
          });
          this.treeData = treeData;
        };
        await getTreeData();

        return getTreeItems("");
      } else {
        return getTreeItems(element.getPath().replace(/^\//, ""));
      }
    } catch (err) {
      vscode.window.showErrorMessage(String(err));
      return [];
    }
  }
}

export class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly path: string,
    public readonly isDirectory: boolean,
    public readonly parent?: TreeItem
  ) {
    const collapsibleState: vscode.TreeItemCollapsibleState = isDirectory
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;
    super(label, collapsibleState);
    this.path = path;
    this.parent = parent;
    if (!isDirectory) {
      this.command = {
        command: "openFile",
        title: "Fetch and open file",
        arguments: [this],
      };
    }
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
