from flask import url_for, jsonify, request, abort, g
from os import environ
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_cors import CORS
from urllib.parse import quote
from uuid import uuid4
import requests
import base64
import json

from .app import app
from .ratelimit import ratelimit
from .auth import auth
from .aws_client import aws_client
from .redis_instance import redis
from .get_session_id import get_session_id


serializer = URLSafeTimedSerializer(environ["SECRET_KEY"])


CORS(
    app,
    origins=environ.get("CORS_ORIGINS", "*"),
    resources={
        r"/authorize": {"methods": ["POST"]},
        r"/check-authorization": {"methods": ["GET"]},
        r"/unauthorize": {"methods": ["POST"]},
        r"/repos/<owner>/<repo>/files": {"methods": ["GET"]},
        r"/repos/<owner>/<repo>/files/<path:file_path>": {"methods": ["GET"]},
    },
)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
    return response


@app.route("/", methods=["GET"])
@ratelimit("guest")
def hello_world():
    return "Hello, World!"


@app.route("/authorize", methods=["POST"])
@ratelimit("guest")
def authorize():
    try:
        session_id = serializer.dumps(str(uuid4()))
        aws_client.create_secret(Name=session_id, SecretString="null")
    except Exception as e:
        app.logger.error(e)
        abort(500, "Unknown error")

    client_id = environ["GITHUB_CLIENT_ID"]
    scope = "public_repo"
    callback_url = (
        url_for("callback", _external=True)
        if environ["ENV"] == "production"
        else "http://localhost:8080/callback"
    )
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={quote(callback_url)}&scope={scope}&state={session_id}"

    return jsonify(
        {
            "redirect_url": github_auth_url,
            "session_id": session_id,
        }
    )


@app.route("/callback", methods=["GET"])
@ratelimit("guest")
def callback():  # check the origin of the request?
    state = request.args.get("state", "")
    code = request.args.get("code", "")

    if not state or not code:
        abort(400, "Missing state or code")

    try:
        serializer.loads(state, max_age=600)
    except (SignatureExpired, BadSignature):
        abort(401, "Invalid or expired state")

    try:
        session_secret = aws_client.get_secret_value(SecretId=state)
    except Exception as e:
        app.logger.error(e)
        abort(500, "Unknown error")
    if "SecretString" not in session_secret:
        abort(500, "Session not found")

    client_id = environ["GITHUB_CLIENT_ID"]
    client_secret = environ["GITHUB_CLIENT_SECRET"]
    callback_url = (
        url_for("callback", _external=True)
        if environ["ENV"] == "production"
        else "http://localhost:8080/callback"
    )
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": callback_url,
    }
    headers = {"Accept": "application/json"}
    try:
        response = requests.post(
            "https://github.com/login/oauth/access_token", data=data, headers=headers
        )
        response.raise_for_status()
    except requests.HTTPError as e:
        abort(e.response.status_code, str(e))
    except Exception as e:
        app.logger.error(e)
        abort(500, "Unknown error")

    access_token = response.json().get("access_token")
    if not access_token:
        abort(500, "Access token not found")

    try:
        aws_client.put_secret_value(SecretId=state, SecretString=access_token)
    except Exception as e:
        app.logger.error(e)
        abort(500, "Unknown error")

    return ("Authorization complete. Feel free to return to VSCode.", 200)


@app.route("/check-authorization", methods=["GET"])
@ratelimit("polling")
@auth
def check_authorization():
    return ("Success", 200)


@app.route("/unauthorize", methods=["POST"])
@ratelimit("guest")
def unauthorize():
    session_id = get_session_id(request)
    if not session_id:
        abort(400, "No session found")

    try:
        aws_client.delete_secret(SecretId=session_id, ForceDeleteWithoutRecovery=True)
    except Exception as e:
        app.logger.error(e)
        abort(500, "Unknown error")

    return ("Success", 200)


@app.route("/repos/<owner>/<repo>/files", methods=["GET"])
@ratelimit("authorized")
@auth
def get_repo(owner, repo):
    try:
        cache_path = f"{owner}/{repo}"
        content = redis.get(cache_path)
        if content:
            content = json.loads(content.decode("utf-8"))
    except Exception as e:
        app.logger.error(e)
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
        app.logger.error(e)
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
        app.logger.error(e)
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
        app.logger.error(e)
        abort(500, "Unknown error")

    try:
        redis.set(cache_path, json.dumps(file_tree))
        redis.expire(cache_path, 60 * 60 * 24)  # 24 hours
    except Exception as e:
        app.logger.error(e)

    return file_tree


@app.route("/repos/<owner>/<repo>/files/<path:file_path>", methods=["GET"])
@ratelimit("authorized")
@auth
def get_file_content(owner, repo, file_path):
    try:
        cache_path = f"{owner}/{repo}/{file_path}"
        content = redis.get(cache_path)
    except Exception as e:
        app.logger.error(e)
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
        app.logger.error(e)
        abort(500, "Unknown error")

    try:
        content = base64.b64decode(response.json()["content"]).decode("utf-8")
    except Exception as e:
        app.logger.error(e)
        abort(500, "Unknown error")

    try:
        redis.set(cache_path, content)
        redis.expire(cache_path, 60 * 60 * 24)  # 24 hours
    except Exception as e:
        app.logger.error(e)

    return content


if __name__ == "__main__":
    app.run()
