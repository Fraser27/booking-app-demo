import json
import os
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

def handler(event, context):
    # Get environment variables
    region = os.environ['REGION']
    service = 'aoss'
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)
    
    # Get OpenSearch endpoint and index name
    host = os.environ['OPENSEARCH_ENDPOINT']
    index_name = os.environ['INDEX_NAME']
    
    # Create OpenSearch client
    client = OpenSearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection
    )
    
    # Parse request body
    body = json.loads(event['body'])
    query = body.get('query', '')
    filters = body.get('filters', {})
    
    # Construct search query with multi-match for better search results
    search_query = {
        "size": 10,
        "query": {
            "bool": {
                "must": [
                    {
                        "multi_match": {
                            "query": query,
                            "fields": ["title^3", "description^2", "location", "amenities"],
                            "type": "best_fields",
                            "fuzziness": "AUTO"
                        }
                    }
                ]
            }
        },
        "sort": [
            {"rating": {"order": "desc"}},
            {"price_per_night": {"order": "asc"}}
        ]
    }
    
    # Add filters if provided
    if filters:
        filter_conditions = []
        for key, value in filters.items():
            if key in ['price_per_night', 'bedrooms', 'bathrooms', 'max_guests']:
                # Range queries for numeric fields
                if isinstance(value, dict) and 'min' in value and 'max' in value:
                    filter_conditions.append({
                        "range": {
                            key: {
                                "gte": value['min'],
                                "lte": value['max']
                            }
                        }
                    })
            else:
                # Term queries for categorical fields
                filter_conditions.append({"term": {key: value}})
        search_query["query"]["bool"]["filter"] = filter_conditions
    
    # Execute search
    response = client.search(
        body=search_query,
        index=index_name
    )
    
    # Format response
    properties = []
    for hit in response['hits']['hits']:
        property_data = hit['_source']
        property_data['id'] = hit['_id']
        property_data['score'] = hit['_score']
        properties.append(property_data)
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True,
        },
        'body': json.dumps({
            'properties': properties,
            'total': response['hits']['total']['value']
        })
    } 

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