from flask import Flask, url_for, jsonify, request, abort
from os import environ
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_cors import CORS
from urllib.parse import quote
from uuid import uuid4
import requests
import boto3


app = Flask(__name__)
app.secret_key = environ["SECRET_KEY"]


CORS(
    app,
    origins="*",
    resources={
        r"/authorize": {"methods": ["GET", "POST", "OPTIONS"]},
        r"/repos/<owner>/<repo>/files": {"methods": ["GET", "POST", "OPTIONS"]},
    },
)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
    return response


aws_session = boto3.session.Session()
aws_client = aws_session.client(
    service_name="secretsmanager",
    region_name=environ["MY_AWS_REGION_NAME"],
    aws_access_key_id=environ["MY_AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=environ["MY_AWS_SECRET_ACCESS_KEY"],
    endpoint_url=environ["MY_AWS_ENDPOINT_URL"],
)

serializer = URLSafeTimedSerializer(environ["SECRET_KEY"])


@app.route("/")
def hello_world():
    return "Hello, World!"


@app.route("/authorize", methods=["GET", "POST", "OPTIONS"])
def authorize():
    try:
        session_id = serializer.dumps(str(uuid4()))
        aws_client.create_secret(Name=session_id, SecretString="null")
    except Exception as e:
        abort(500, f"AWS Secret creation failed - {str(e)}")

    client_id = environ["GITHUB_CLIENT_ID"]
    scope = "public_repo"
    callback_url = (
        url_for("callback", _external=True)
        if environ["ENV"] == "production"
        else "http://192.168.1.18:8080/callback"  # also try changing to localhost instead both here and in github settings
    )

    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={quote(callback_url)}&scope={scope}&state={session_id}"

    return jsonify(
        {
            "redirect_url": github_auth_url,
            "session_id": session_id,
        }
    )


@app.route("/callback")
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
        abort(401, f"Unauthorized: AWS Secret fetch failed - {str(e)}")

    if "SecretString" not in session_secret:
        abort(401, "Invalid state")

    client_id = environ["GITHUB_CLIENT_ID"]
    client_secret = environ["GITHUB_CLIENT_SECRET"]
    callback_url = (
        url_for("callback", _external=True)
        if environ["ENV"] == "production"
        else "http://192.168.1.18:8080/callback"  # also try changing to localhost instead both here and in github settings
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
    except Exception as e:
        abort(401, f"GitHub access token fetch failed - {str(e)}")

    access_token = response.json().get("access_token")

    try:
        aws_client.put_secret_value(SecretId=state, SecretString=access_token)
    except Exception as e:
        abort(500, f"AWS Secret update failed - {str(e)}")

    return ("Yes", 200)


@app.route("/repos/<owner>/<repo>/files")
def get_repo(owner, repo):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        abort(401, "Authorization header not found")

    session_id = auth_header.split(" ")[1]

    try:
        session_secret = aws_client.get_secret_value(SecretId=session_id)
    except Exception as e:
        abort(401, f"Unauthorized: AWS Secret fetch failed - {str(e)}")

    if "SecretString" not in session_secret:
        abort(401, "Unauthorized: SecretString not found")

    access_token = session_secret["SecretString"]

    if not access_token or access_token == "null":
        abort(401, "Unauthorized: access_token not found")

    return access_token

    # headers = {"Authorization": f"token {access_token}"}
    # response = requests.get(
    #     f"https://api.github.com/repos/{owner}/{repo}/contents/",
    #     headers=headers,
    # )
    # response_json = response.json()
    # return jsonify(response_json)


if __name__ == "__main__":
    app.run()
