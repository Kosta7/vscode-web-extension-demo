# RepoView

This [VS Code web extension](https://code.visualstudio.com/api/extension-guides/web-extensions) allows browsing GitHub repositories. After user authorization via [GitHub OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), it fetches and displays repository files in a sidebar. Features include caching and rate limiting. The backend uses Flask and the [GitHub REST API](https://docs.github.com/en/rest?apiVersion=2022-11-28).

## Local development

### Prerequisites

| Item                                                         | Version    |
|--------------------------------------------------------------|------------|
| [Node.js](https://nodejs.org/)                               | >= 16.17.0 |
| [Python](https://www.python.org/downloads/)                  | >= 3.11.4  |
| [Docker](https://www.docker.com)                             |   latest   |
| [PNPM](https://pnpm.io/installation)                         |   latest   |


### Setup

1. Get environment variables
    1. Copy [apps/backend/.env.example](apps/backend/.env.example)  file to `apps/backend/.env`
    2. [Register a new OAuth application](https://github.com/settings/applications/new) on GitHub with these parameters:
        | Key                         | Value                                      | Example                      |
        |-----------------------------|--------------------------------------------|------------------------------|
        | Application name            | any                                        | `repoview`                   |
        | Homepage URL                | any                                        | `https://github.com/kosta7/RepoView` |
        | Authorization callback URL  | `http://localhost:8080`                    |                              |
        | Enable Device Flow          | `false`                                    |                              |
    3. Copy generated Client ID and Client Secret and paste them into `apps/backend/.env` as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
    4. Run `python -c 'import secrets; print(secrets.token_hex())'` and paste the result into `apps/backend/.env` as `SECRET_KEY`
3. Activate a new Python environment
    1. `python -m venv apps/backend/venv`
    2. `source apps/backend/venv/bin/activate`
4. Install dependencies:
    1. `pnpm install`
    2. `pip install -r apps/backend/requirements.txt`
5. Start Docker to enable caching and session secret management

### Running

```
pnpm run dev
```


## Contribution

Feel free to [open an issue](https://github.com/kosta7/vscode-web-extension-demo/issues/new) if you have any questions or suggestions.
