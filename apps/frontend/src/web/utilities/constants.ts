import * as vscode from "vscode";

const isDevelopment = vscode.env.machineId === "someValue.machineId";
export const apiUrlOrigin = isDevelopment
  ? "http://localhost:8080"
  : "https://vscode-web-extension-demo-backend.vercel.app";

export const LEADING_SLASH = /^\//;
