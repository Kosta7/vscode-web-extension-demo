from flask import url_for, jsonify, request, abort, Blueprint, current_app
from os import environ
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from urllib.parse import quote
from uuid import uuid4
import requests

from .ratelimit import ratelimit
from .auth import auth
from .aws_client import aws_client
from .get_session_id import get_session_id

serializer = URLSafeTimedSerializer(environ["SECRET_KEY"])

oauth = Blueprint("oauth", __name__)


@oauth.route("/authorize", methods=["POST"])
@ratelimit("guest")
def authorize():
    try:
        session_id = serializer.dumps(str(uuid4()))
        aws_client.create_secret(Name=session_id, SecretString="null")
    except Exception as e:
        current_app.logger.error(e)
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


@oauth.route("/callback", methods=["GET"])
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
        current_app.logger.error(e)
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
        current_app.logger.error(e)
        abort(500, "Unknown error")

    access_token = response.json().get("access_token")
    if not access_token:
        abort(500, "Access token not found")

    try:
        aws_client.put_secret_value(SecretId=state, SecretString=access_token)
    except Exception as e:
        current_app.logger.error(e)
        abort(500, "Unknown error")

    return ("Authorization complete. Feel free to return to VSCode.", 200)


@oauth.route("/check-authorization", methods=["GET"])
@ratelimit("polling")
@auth
def check_authorization():
    return ("Success", 200)


@oauth.route("/unauthorize", methods=["POST"])
@ratelimit("guest")
def unauthorize():
    session_id = get_session_id(request)
    if not session_id:
        abort(400, "No session found")

    try:
        aws_client.delete_secret(SecretId=session_id, ForceDeleteWithoutRecovery=True)
    except Exception as e:
        current_app.logger.error(e)
        abort(500, "Unknown error")

    return ("Success", 200)
