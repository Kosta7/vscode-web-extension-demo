import boto3
from os import environ


aws_session = boto3.session.Session()
aws_client = aws_session.client(
    service_name="secretsmanager",
    region_name=environ["MY_AWS_REGION_NAME"],
    aws_access_key_id=environ["MY_AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=environ["MY_AWS_SECRET_ACCESS_KEY"],
    endpoint_url=environ["MY_AWS_ENDPOINT_URL"]
    if environ["ENV"] == "development"
    else None,
)
