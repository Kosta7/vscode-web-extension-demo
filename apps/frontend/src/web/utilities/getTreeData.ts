import * as vscode from "vscode";

export type TreeData = {
  path: string;
  sha: string;
  type: string;
  [key: string]: any;
}[];

export const getTreeData = async (context: vscode.ExtensionContext) => {
  const repoId = context.globalState.get("repoId") as string;
  if (!repoId) throw new Error("Error getting repository name or owner");

  const cachedTreeData: { treeData: TreeData; expiryDate: Date } | undefined =
    context.globalState.get(repoId);
  if (cachedTreeData) {
    const isExpired =
      new Date().getTime() > new Date(cachedTreeData.expiryDate).getTime();
    if (isExpired) {
      await context.globalState.update(repoId, undefined);
    } else {
      return cachedTreeData.treeData;
    }
  }

  const sessionId = await context.secrets.get("sessionId");
  const apiUrlOrigin = context.globalState.get("apiUrlOrigin");
  const response = await fetch(`${apiUrlOrigin}/repos/${repoId}/files`, {
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

  await context.globalState.update(repoId, {
    treeData,
    expiryDate: new Date().getTime() + 1000 * 60 * 60 * 24, // 24h from now
  });

  return treeData;
};
