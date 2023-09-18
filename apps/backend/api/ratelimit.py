from flask import request, abort
from functools import wraps
from upstash_ratelimit import Ratelimit, FixedWindow, TokenBucket
from typing import Literal

from redis_instance import redis
from get_session_id import get_session_id
from app import app


RateLimitType = Literal["guest", "authorized", "polling"]

ratelimiters: dict[str, RateLimitType] = {
    "guest": Ratelimit(
        redis=redis,
        limiter=FixedWindow(max_requests=25, window=50),
        prefix="guest-ratelimit",
    ),
    "authorized": Ratelimit(
        redis=redis,
        limiter=FixedWindow(max_requests=100, window=50),
        prefix="authorized-ratelimit",
    ),
    "polling": Ratelimit(
        redis=redis,
        limiter=TokenBucket(max_tokens=2, refill_rate=1, interval=1),
        prefix="polling-ratelimit",
    ),
}


def ratelimit(type: RateLimitType):
    def actual_decorator(func):
        @wraps(func)
        def decorated_function(*args, **kwargs):
            try:
                ratelimit = ratelimiters[type]
                identifier = (
                    request.endpoint if type == "guest" else get_session_id(request)
                )
                response = ratelimit.limit(identifier)
            except Exception as e:
                abort(500, "Unknown error")

            if not response.allowed:
                abort(429, "Too Many Requests")

            return func(*args, **kwargs)

        return decorated_function

    return actual_decorator
