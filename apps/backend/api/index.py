from flask import Flask, url_for
from authlib.integrations.flask_client import OAuth
from os import environ


app = Flask(__name__)
app.secret_key = environ["FLASK_SECRET_KEY"]

oauth = OAuth(app)

github = oauth.register(
    name="github",
    client_id=environ["GITHUB_CLIENT_ID"],
    client_secret=environ["GITHUB_CLIENT_SECRET"],
    authorize_url="https://github.com/login/oauth/authorize",
    access_token_url="https://github.com/login/oauth/access_token",
    api_base_url="https://api.github.com",
)


@app.route("/")
def hello_world():
    return "Hello, World!"


@app.route("/authorize")
def authorize():
    is_prod = environ["FLASK_ENV"] == "production"
    _scheme = "https" if is_prod else "http"
    redirect_uri = url_for("callback", _external=True, _scheme=_scheme)
    # return github.authorize_redirect(redirect_uri, scope="public_repo")
    return redirect_uri


@app.route("/callback")
def callback():
    access_token = github.authorize_access_token().get("access_token")
    return "Access token: " + access_token


if __name__ == "__main__":
    app.run()
