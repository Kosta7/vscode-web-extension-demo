# GitHub Repos

## Docs

[GitHub REST API](https://docs.github.com/en/rest?apiVersion=2022-11-28)

## Endpoints

1. `GET /repos/<owner>/<repo>/files`: This endpoint retrieves the file tree of a specific GitHub repository. It first checks if the file tree is cached in Redis. If not, it fetches the file tree from the GitHub API, caches it in Redis for 24 hours, and then returns it. The `owner` and `repo` parameters in the URL are used to specify the GitHub repository.

2. `GET /repos/<owner>/<repo>/files/<path:file_path>`: This endpoint retrieves the content of a specific file in a GitHub repository. It first checks if the file content is cached in Redis. If not, it fetches the file content from the GitHub API, decodes it from base64, caches it in Redis for 24 hours, and then returns it. The `owner`, `repo`, and `file_path` parameters in the URL are used to specify the file in the GitHub repository.
