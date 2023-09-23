# RepoView

This [VS Code web extension](https://code.visualstudio.com/api/extension-guides/web-extensions) allows browsing GitHub repositories. After user authorization, repo files appear in sidebar; individual files can be clicked to view contents in a panel. Includes caching and rate limiting.

<img width="1107" alt="image" src="https://github.com/kosta7/RepoView/assets/22333399/c3fe4c0f-9ef7-4faa-b420-c97f65489e5a">
<img width="1107" alt="image" src="https://github.com/kosta7/RepoView/assets/22333399/ab389602-921b-4538-8781-947c3a891576">

## Stack

- Frontend
    - Initialized with [vscode-generator-code](https://github.com/Microsoft/vscode-generator-code)
    - Webview: [vscode-webview-ui-toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit), [Vite](https://vitejs.dev), [React](https://react.dev)
- Backend
    - **Docs**: [oauth.md](apps/backend/oauth.md), [repos.md](apps/backend/repos.md)
    - Framework: [Flask](https://flask.palletsprojects.com/en/2.3.x/)
    - Deployable to [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
    - Secrets: [AWS](https://aws.amazon.com/secrets-manager/)
    - Cache: [Redis](https://redis.io) (dev), [Upstash](https://upstash.com) (prod)
    - Rate limit: [Upstash](https://upstash.com) (prod)
- Build: [Turborepo](https://turbo.build/repo/docs)

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
    1. Copy the file [./apps/backend/.env.example](apps/backend/.env.example) to `./apps/backend/.env`
    2. [Register a new OAuth application](https://github.com/settings/applications/new) on GitHub with these parameters:
        | Key                         | Value                                      | Example                      |
        |-----------------------------|--------------------------------------------|------------------------------|
        | Application name            | any                                        | `repoview`                   |
        | Homepage URL                | any                                        | `https://github.com/kosta7/RepoView` |
        | Authorization callback URL  | `http://localhost:8080`                    |                              |
        | Enable Device Flow          | `false`                                    |                              |
    3. Copy generated Client ID and Client Secret and paste them into `./apps/backend/.env` as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
    4. Run `python -c 'import secrets; print(secrets.token_hex())'` and paste the result into `./apps/backend/.env` as `SECRET_KEY`
3. Activate a new Python environment (e.g. using `python -m venv`)
    1. `python -m venv apps/backend/venv`
    2. `source apps/backend/venv/bin/activate`
4. Install dependencies:
    1. `pnpm install`
    2. `pip install -r apps/backend/requirements.txt`
5. Start Docker (to be able to run VS Code development server, Redis, and AWS)

### Running

```
pnpm run dev
```


## Contribution

The purpose of this project is to explore VS Code capabilities. Feel free to [open an issue](https://github.com/kosta7/vscode-web-extension-demo/issues/new) if you have a question or suggestion.
