from flask import Flask, redirect, request
import requests
import urllib.parse
from os import environ

app = Flask(__name__)


@app.route("/")
def hello_world():
    return "Hello, World!"


@app.route("/authorize")
def authorize():
    client_id = environ["GITHUB_CLIENT_ID"]
    redirect_uri = environ["GITHUB_REDIRECT_URI"]
    scope = "public_repo"
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={urllib.parse.quote(redirect_uri)}&scope={scope}"
    return redirect(github_auth_url)


@app.route("/callback")
def callback():
    code = request.args.get("code", "")
    client_id = environ["GITHUB_CLIENT_ID"]
    client_secret = environ["GITHUB_CLIENT_SECRET"]
    redirect_uri = environ["GITHUB_REDIRECT_URI"]
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    headers = {"Accept": "application/json"}
    response = requests.post(
        "https://github.com/login/oauth/access_token", data=data, headers=headers
    )
    response_json = response.json()
    access_token = response_json.get("access_token")
    # Here you would store the access token for use in your application
    return "Access token: " + access_token


if __name__ == "__main__":
    app.run()
