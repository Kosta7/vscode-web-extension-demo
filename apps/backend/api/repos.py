from flask import abort, g, current_app, Blueprint
import requests
import base64
import json

from .ratelimit import ratelimit
from .auth import auth
from .redis_instance import redis

repos = Blueprint("repos", __name__)


@repos.route("/repos/<owner>/<repo>/files", methods=["GET"])
@ratelimit("authorized")
@auth
def get_repo(owner, repo):
    current_app.logger.info(f"get_repo: {owner}/{repo}")

    try:
        cache_path = f"{owner}/{repo}"
        content = redis.get(cache_path)
        if content:
            content = json.loads(content.decode("utf-8"))
    except Exception as e:
        current_app.logger.error(e)
    if content:
        return content

    access_token = g.pop("access_token", None)
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        repo_response = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=headers,
        )
        repo_response.raise_for_status()
    except requests.HTTPError as e:
        abort(e.response.status_code, str(e))
    try:
        default_branch = repo_response.json()["default_branch"]
    except Exception as e:
        current_app.logger.error(e)
        abort(500, "Unknown error")

    try:
        branch_response = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/branches/{default_branch}",
            headers=headers,
        )
        branch_response.raise_for_status()
    except requests.HTTPError as e:
        abort(e.response.status_code, str(e))
    try:
        head_sha = branch_response.json()["commit"]["sha"]
    except Exception as e:
        current_app.logger.error(e)
        abort(500, "Unknown error")

    try:
        tree_response = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/{head_sha}?recursive=1",
            headers=headers,
        )
        tree_response.raise_for_status()
    except requests.HTTPError as e:
        abort(e.response.status_code, str(e))
    try:
        file_tree = tree_response.json()
    except Exception as e:
        current_app.logger.error(e)
        abort(500, "Unknown error")

    try:
        redis.set(cache_path, json.dumps(file_tree))
        redis.expire(cache_path, 60 * 60 * 24)  # 24 hours
    except Exception as e:
        current_app.logger.error(e)

    return file_tree


@repos.route("/repos/<owner>/<repo>/files/<path:file_path>", methods=["GET"])
@ratelimit("authorized")
@auth
def get_file_content(owner, repo, file_path):
    try:
        cache_path = f"{owner}/{repo}/{file_path}"
        content = redis.get(cache_path)
    except Exception as e:
        current_app.logger.error(e)
    if content:
        return content

    access_token = g.access_token
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}",
            headers=headers,
        )
        response.raise_for_status()
    except Exception as e:
        current_app.logger.error(e)
        abort(500, "Unknown error")

    try:
        content = base64.b64decode(response.json()["content"]).decode("utf-8")
    except Exception as e:
        current_app.logger.error(e)
        abort(500, "Unknown error")

    try:
        redis.set(cache_path, content)
        redis.expire(cache_path, 60 * 60 * 24)  # 24 hours
    except Exception as e:
        current_app.logger.error(e)

    return content
