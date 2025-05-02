import json
import os
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import uuid
from datetime import datetime

def handler(event, context):
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
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Property data is required'})
            }
        
        # Generate unique property ID
        property_id = str(uuid.uuid4())
        
        # Handle image upload if present
        image_urls = []
        if 'images' in property_data:
            for image in property_data['images']:
                # Generate unique filename
                image_key = f"properties/{property_id}/{str(uuid.uuid4())}.jpg"
                
                # Upload to S3
                s3_client.put_object(
                    Bucket=s3_bucket,
                    Key=image_key,
                    Body=image['content'],
                    ContentType='image/jpeg'
                )
                
                # Generate presigned URL for the image
                image_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': s3_bucket, 'Key': image_key},
                    ExpiresIn=3600  # URL expires in 1 hour
                )
                image_urls.append(image_url)
            
            # Remove image content from property data
            del property_data['images']
        
        # Add metadata to property data
        property_data.update({
            'property_id': property_id,
            'image_urls': image_urls,
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
                'property_id': property_id,
                'image_urls': image_urls
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        } 