from flask import Flask
from flask_cors import CORS
from os import environ

from .ratelimit import ratelimit
from .oauth import oauth
from .repos import repos

app = Flask(__name__)
app.secret_key = environ["SECRET_KEY"]

CORS(
    app,
    origins=environ.get("CORS_ORIGINS", "*"),
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


app.register_blueprint(oauth)
app.register_blueprint(repos)


@app.route("/", methods=["GET"])
@ratelimit("guest")
def hello_world():
    return "Hello, World!"


if __name__ == "__main__":
    app.run()
