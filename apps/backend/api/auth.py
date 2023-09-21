from flask import request, abort, g
from functools import wraps

from .aws_client import aws_client
from .get_session_id import get_session_id
from .app import app


def auth(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        session_id = get_session_id(request)
        if not session_id:
            abort(401, "No session found")

        try:
            session_secret = aws_client.get_secret_value(SecretId=session_id)
        except Exception as e:
            app.logger.error(e)
            abort(401, "Unknown error")

        if "SecretString" not in session_secret:
            abort(401, "No session found")
        access_token = session_secret["SecretString"]
        if not access_token or access_token == "null":
            abort(401, "Not authorized")

        g.access_token = access_token

        return func(*args, **kwargs)

    return decorated_function
