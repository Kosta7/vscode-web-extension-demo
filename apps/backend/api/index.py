from flask import Flask, url_for, Response, jsonify
from authlib.integrations.flask_client import OAuth
from os import environ
from itsdangerous import URLSafeTimedSerializer
from flask_cors import CORS
from urllib.parse import urlparse, parse_qs
from uuid import uuid4


app = Flask(__name__)
app.secret_key = environ["SECRET_KEY"]


CORS(
    app,
    origins="*",
    resources={r"/authorize": {"methods": ["GET", "POST", "OPTIONS"]}},
)

oauth = OAuth(app)

github = oauth.register(
    name="github",
    client_id=environ["GITHUB_CLIENT_ID"],
    client_secret=environ["GITHUB_CLIENT_SECRET"],
    authorize_url="https://github.com/login/oauth/authorize",
    access_token_url="https://github.com/login/oauth/access_token",
    api_base_url="https://api.github.com/",
    client_kwargs={
        "scope": "public_repo",
    },
)

serializer = URLSafeTimedSerializer(environ["SECRET_KEY"])


@app.route("/")
def hello_world():
    return "Hello, World!"


@app.route("/authorize", methods=["GET", "POST", "OPTIONS"])
def authorize():
    github_state = str(uuid4())
    is_prod = environ["ENV"] == "production"
    callback_url = (
        url_for("callback", _external=True)
        if is_prod
        else "http://192.168.1.18:8080/callback"
    )
    github_redirect_resp = github.authorize_redirect(callback_url, state=github_state)
    redirect_url = github_redirect_resp.headers.get("Location")

    parsed_redirect_url = urlparse(redirect_url)
    redirect_url_params = parse_qs(parsed_redirect_url.query)
    do_states_match = redirect_url_params.get("state", [None])[0] == github_state
    if not do_states_match:
        raise Exception("States do not match")

    session_id = serializer.dumps(str(uuid4()))

    return jsonify(
        {
            "redirect_url": redirect_url,
            "session_id": session_id,
        }
    )


@app.route("/callback")
def callback():
    access_token = github.authorize_access_token().get(
        "access_token"
    )  # mismatching_state in dev environment

    return "Access token: " + access_token


if __name__ == "__main__":
    app.run()
