from flask import Flask
from os import environ


app = Flask(__name__)
app.secret_key = environ["SECRET_KEY"]
