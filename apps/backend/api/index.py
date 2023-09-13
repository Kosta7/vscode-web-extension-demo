from flask import Flask, url_for, jsonify, request
from os import environ
from itsdangerous import URLSafeTimedSerializer
from flask_cors import CORS
from urllib.parse import urlparse, parse_qs, quote
from uuid import uuid4
import requests


app = Flask(__name__)
app.secret_key = environ["SECRET_KEY"]


CORS(
    app,
    origins="*",
    resources={r"/authorize": {"methods": ["GET", "POST", "OPTIONS"]}},
)

serializer = URLSafeTimedSerializer(environ["SECRET_KEY"])

callback_url = (
    url_for("callback", _external=True)
    if environ["ENV"] == "production"
    else "http://192.168.1.18:8080/callback"  # also try changing to localhost instead both here and in github settings
)


@app.route("/")
def hello_world():
    return "Hello, World!"


@app.route("/authorize", methods=["GET", "POST", "OPTIONS"])
def authorize():
    client_id = environ["GITHUB_CLIENT_ID"]
    scope = "public_repo"
    state = str(uuid4())

    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={quote(callback_url)}&scope={scope}&state={state}"
    github_auth_url_params = parse_qs(urlparse(github_auth_url).query)
    do_states_match = github_auth_url_params.get("state", [None])[0] == state
    if not do_states_match:
        raise Exception("GitHub auth states do not match")

    session_id = serializer.dumps(str(uuid4()))

    return jsonify(
        {
            "redirect_url": github_auth_url,
            "session_id": session_id,
        }
    )


@app.route("/callback")
def callback():
    code = request.args.get("code", "")
    client_id = environ["GITHUB_CLIENT_ID"]
    client_secret = environ["GITHUB_CLIENT_SECRET"]
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": callback_url,
    }
    headers = {"Accept": "application/json"}
    response = requests.post(
        "https://github.com/login/oauth/access_token", data=data, headers=headers
    )
    response_json = response.json()
    access_token = response_json.get("access_token")

    return "Access token: " + access_token


if __name__ == "__main__":
    app.run()
