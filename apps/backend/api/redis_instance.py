from upstash_redis import Redis as UpstashRedis
from redis import Redis as LocalRedis
from os import environ


redis = (
    UpstashRedis.from_env(allow_telemetry=False)
    if environ["ENV"] == "production"
    else LocalRedis(host="localhost", port=6379, db=0)
)
