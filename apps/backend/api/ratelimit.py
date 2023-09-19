from flask import request, abort
from functools import wraps
from upstash_ratelimit import Ratelimit, FixedWindow, TokenBucket
from typing import Literal
from os import environ

from .redis_instance import redis
from .get_session_id import get_session_id
from .app import app


RateLimitType = Literal["guest", "authorized", "polling"]

ratelimiters: dict[str, RateLimitType] = {
    "guest": Ratelimit(
        redis=redis,
        limiter=FixedWindow(max_requests=25, window=50, unit="s"),
        prefix="guest-ratelimit",
    ),
    "authorized": Ratelimit(
        redis=redis,
        limiter=FixedWindow(max_requests=5000, window=1, unit="h"),
        prefix="authorized-ratelimit",
    ),
    "polling": Ratelimit(
        redis=redis,
        limiter=TokenBucket(max_tokens=2, refill_rate=1, interval=1, unit="s"),
        prefix="polling-ratelimit",
    ),
}


def ratelimit(type: RateLimitType):
    def actual_decorator(func):
        @wraps(func)
        def decorated_function(*args, **kwargs):
            if environ["ENV"] == "development":
                return func(
                    *args, **kwargs
                )  # todo: don't skip rate limiting in development

            try:
                ratelimit = ratelimiters[type]
                identifier = (
                    request.endpoint if type == "guest" else get_session_id(request)
                )
                response = ratelimit.limit(identifier)
            except Exception as e:
                app.logger.error(e)
                abort(500, "Unknown error")

            if not response.allowed:
                abort(429, "Too Many Requests")

            return func(*args, **kwargs)

        return decorated_function

    return actual_decorator
