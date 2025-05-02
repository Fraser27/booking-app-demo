import json
import os
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import uuid
from datetime import datetime
from decimal import Decimal
import re
import logging

LOG = logging.getLogger()
LOG.setLevel(logging.INFO)

def handler(event, context):
    
    api_map = {
            'POST/properties': lambda x: index_property(x),
            'GET/properties/upload-image': lambda x: create_presigned_post(x)
        }

    http_method = event['httpMethod'] if 'httpMethod' in event else ''
    api_path = http_method + event['resource']
    try:
        if api_path in api_map:
            LOG.debug(f"method=handler , api_path={api_path}")
            return respond(None, api_map[api_path](event))
        else:
            LOG.info(f"error=api_not_found , api={api_path}")
            return respond({"error": 'api_not_supported'}, None)
    except Exception:
        LOG.exception(f"error=error_processing_api, api={api_path}")
        return respond({"error": 'system_exception'}, None)

def index_property(event):
    try:
        # Get environment variables
        region = os.environ['AWS_REGION']
        opensearch_endpoint = os.environ['OPENSEARCH_ENDPOINT']
        index_name = os.environ['INDEX_NAME']
        s3_bucket = os.environ['S3_BUCKET']
        
        # Initialize AWS clients
        s3_client = boto3.client('s3')
        credentials = boto3.Session().get_credentials()
        awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, 'aoss', session_token=credentials.token)
        
        # Initialize OpenSearch client
        opensearch_client = OpenSearch(
            hosts=[{'host': opensearch_endpoint, 'port': 443}],
            http_auth=awsauth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )
        
        # Parse request body
        body = json.loads(event['body'])
        property_data = body.get('property')
        
        if not property_data:
            return {"error": "Property data is required", "statusCode": 400}
        
        # Generate unique property ID
        property_id = str(uuid.uuid4())
        
        # Add metadata to property data
        property_data.update({
            'property_id': property_id,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        })
        
        # Index property in OpenSearch
        opensearch_client.index(
            index=index_name,
            body=property_data,
            id=property_id
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Property indexed successfully',
                'property_id': property_id
                
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

    
            
def create_presigned_post(event):
    # Generate a presigned S3 POST URL
    LOG.info(f"method=create_presigned_post , event={event}")
    query_params = {}
    if 'queryStringParameters' in event:
        query_params = event['queryStringParameters']
    
    if 'requestContext' in event and 'authorizer' in event['requestContext']:
            if 'claims' in event['requestContext']['authorizer']:
                email_id = event['requestContext']['authorizer']['claims']['email']
    
    if 'file_extension' in query_params and 'file_name' in query_params:
        extension = query_params['file_extension']
        file_name = query_params['file_name']
        
        # remove special characters from file name
        file_name = re.sub(r'[^a-zA-Z0-9_\-\.]','',file_name)

        session = boto3.Session()
        s3_client = session.client('s3', region_name=os.environ['AWS_REGION'])
        file_name = file_name.replace(' ', '_')
        s3_key = f"properties/data/{file_name}.{extension}"
        response = s3_client.generate_presigned_post(Bucket=os.environ['S3_BUCKET'], Key=s3_key)
        return {"success": True, "result": response, "statusCode": "200"}
    else:
        return {'statusCode': 400, 'body': json.dumps({'error': 'Missing file_extension field cannot generate signed url'})}


class CustomJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if float(obj).is_integer():
                return int(float(obj))
            else:
                return float(obj)
        return super(CustomJsonEncoder, self).default(obj)

# JSON REST output builder method
def respond(err, res=None):
    return {
        "statusCode": "400" if err else res["statusCode"],
        "body": json.dumps(err) if err else json.dumps(res, cls=CustomJsonEncoder),
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "*",
        },
    }