import { vscode } from "./utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState, useEffect } from "react";

function App() {
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    setIsAuthorized(
      document
        .getElementById("is-authorized")
        ?.getAttribute("is-authorized") === "true"
    );

    const isAuthorizedListener = (event: MessageEvent) => {
      const { command, payload, error } = event.data;
      if (error) return;
      else if (command === "is-authorized") setIsAuthorized(payload);
    };
    window.addEventListener("message", isAuthorizedListener);
    return () => window.removeEventListener("message", isAuthorizedListener);
  }, []);

  const onSubmitUrl = () => {
    const command = "submit-repo";
    try {
      const githubUrlRegex =
        /^(https?:\/\/)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/?$/;
      const isGithubUrlValid = githubUrlRegex.test(githubRepoUrl);
      const [, , repoOwner, repoName] =
        githubRepoUrl.match(githubUrlRegex) || [];
      if (!isGithubUrlValid || !repoOwner || !repoName)
        throw new Error("Invalid GitHub repository URL");

      vscode.postMessage({ command, payload: `${repoOwner}/${repoName}` });
    } catch (error) {
      vscode.postMessage({ command, error: String(error) });
    }
  };

  return (
    <main className="flex flex-col gap-1">
      <VSCodeTextField
        placeholder="GitHub Repository URL"
        onInput={(e) => setGithubRepoUrl((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmitUrl()}
      />
      {githubRepoUrl ? (
        <VSCodeButton
          onClick={onSubmitUrl}
          className="mb-4"
          appearance="primary"
        >
          {isAuthorized ? "Fetch" : "Authorize & Fetch"}
        </VSCodeButton>
      ) : null}
    </main>
  );
}

export default App;
