import * as vscode from "vscode";

const isDevelopment = vscode.env.machineId === "someValue.machineId";
export const apiUrlOrigin = isDevelopment
  ? "http://localhost:8080"
  : "https://vscode-web-extension-demo-backend.vercel.app";

export const LEADING_SLASH = /^\//;

export const FILE_CONTENT_URI_SCHEME = "repoview";

export const KEYS = {
  SESSION_ID: "sessionId",
  REPO_ID: "repoId",
  IS_AUTHORIZED: "isAuthorized",
  PATH: "path",
  SET_CONTEXT: "setContext",
  IS_FILE_TREE_OPEN: "isFileTreeOpen",
};

export const COMMANDS = {
  AUTHORIZE_AND_FETCH: "authorizeAndFetch",
  GO_TO_GITHUB_URL_INPUT: "goToGithubUrlInput",
  OPEN_FILE: "openFile",
  UNAUTHORIZE: "unauthorize",
};
