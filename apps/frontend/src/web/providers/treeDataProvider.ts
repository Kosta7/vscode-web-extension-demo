import * as vscode from "vscode";

import { getTreeData, type TreeData } from "../utilities/getTreeData";
import { LEADING_SLASH, COMMANDS } from "../utilities/constants";

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private treeData: TreeData = [];
  private treeItems: Map<string, TreeItem> = new Map();

  constructor(private _extensionContext?: vscode.ExtensionContext) {}

  setContext(context: vscode.ExtensionContext) {
    this._extensionContext = context;
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  getTreeItemByPath(path: string): TreeItem | undefined {
    return this.treeItems.get(path);
  }

  getParent(element: TreeItem): TreeItem | null {
    return element.parent || null;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    try {
      const instantiateChildren = (parentPath: string) =>
        this.treeData
          .filter((item) => item.path.startsWith(parentPath))
          .reduce((acc: TreeItem[], item) => {
            const label = item.path
              .replace(parentPath, "")
              .replace(LEADING_SLASH, "") // without a leading slash
              .split("/")[0];

            const itemPath = "/" + item.path;

            if (!label || acc.find((item) => item.label === label)) return acc;

            const treeItem = new TreeItem(
              label,
              itemPath,
              item.type == "tree",
              element
            );
            this.treeItems.set(itemPath, treeItem);

            return [...acc, treeItem];
          }, [])
          .sort((a, b) => a.label.localeCompare(b.label));

      const isRootItem = !element;
      if (isRootItem) {
        return instantiateChildren("");
      } else {
        return instantiateChildren(
          element.getPath().replace(LEADING_SLASH, "")
        );
      }
    } catch (err) {
      vscode.window.showErrorMessage(String(err));
      return [];
    }
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItem | undefined | null | void
  > = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  async empty(): Promise<void> {
    this.treeData = [];
    this._onDidChangeTreeData.fire();
  }

  async refresh(): Promise<void> {
    if (!this._extensionContext) {
      throw new Error("No extension context in a provider");
    }

    this.empty();

    this.treeData = await getTreeData(this._extensionContext);
    this._onDidChangeTreeData.fire();
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
        command: COMMANDS.OPEN_FILE,
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
