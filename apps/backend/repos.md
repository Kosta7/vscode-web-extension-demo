# GitHub Repos

## Docs

[GitHub REST API](https://docs.github.com/en/rest?apiVersion=2022-11-28)

## Endpoints

1. `GET /repos/<owner>/<repo>/files`: Fetches GitHub repo's file tree; checks Redis cache first, fetches and caches for 24 hrs if not. URL specifies `owner` and `repo`.

2. `GET /repos/<owner>/<repo>/files/<path:file_path>`: Fetches specific file in GitHub repo; checks Redis cache, fetches, decodes from base64, caches for 24 hrs if not. URL specifies `owner`, `repo`, and `file_path`.
