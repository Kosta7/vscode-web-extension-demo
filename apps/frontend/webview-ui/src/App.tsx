import { vscode } from "./utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";

function App() {
  const [githubRepoUrl, setGithubRepoUrl] = useState("");

  const onSubmitUrl = () => {
    const command = "submit-repo";
    try {
      const githubUrlRegex =
        /^(https?:\/\/)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/?$/;
      const isGithubUrlValid = githubUrlRegex.test(githubRepoUrl);
      if (!isGithubUrlValid) throw new Error("Invalid GitHub repository URL");
      const [, , repoOwner, repoName] =
        githubRepoUrl.match(githubUrlRegex) || [];
      if (!repoOwner || !repoName)
        throw new Error("Invalid GitHub repository URL");

      vscode.postMessage({ command, payload: `${repoOwner}/${repoName}` });
    } catch (error) {
      vscode.postMessage({ command, error: String(error) });
    }
  };

  return (
    <main className="flex flex-col gap-1">
      <VSCodeTextField
        autoFocus={true}
        placeholder="Paste a GitHub Repo URL"
        onChange={(e) => setGithubRepoUrl((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmitUrl()}
      />
      <VSCodeButton onClick={onSubmitUrl} appearance="primary">
        Authorize & Fetch
      </VSCodeButton>
    </main>
  );
}

export default App;
