# RepoView

This [VS Code web extension](https://code.visualstudio.com/api/extension-guides/web-extensions) allows browsing of GitHub repositories. After user authorization via [GitHub OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), it fetches and displays repository files in a sidebar. Features include caching and rate limiting. The backend uses Flask and the [GitHub REST API](https://docs.github.com/en/rest?apiVersion=2022-11-28).

## Prerequisites

| Item                                                         | Version    |
|--------------------------------------------------------------|------------|
| [Node.js](https://nodejs.org/)                               | >= 16.17.0 |
| [Python](https://www.python.org/downloads/)                  | >= 3.11.4  |
| [Docker](https://www.docker.com)                             |   latest   |
| [PNPM](https://pnpm.io/installation)                         |   latest   |


## Installation

1. Start Docker
2. Activate a new Python environment
    1. `python -m venv apps/backend/venv`
    2. `source apps/backend/venv/bin/activate`
4. Install dependencies:
    1. `pnpm install`
    2. `pip install -r apps/backend/requirements.txt`

## Development

```
pnpm run dev
```


## Contribution

Feel free to [open an issue](https://github.com/kosta7/vscode-web-extension-demo/issues/new) if you have any questions or suggestions.
