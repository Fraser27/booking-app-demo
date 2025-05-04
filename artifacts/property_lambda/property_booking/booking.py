import json
import os
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key
from decimal import Decimal

def handler(event, context):
    # Get environment variables
    region = os.environ['REGION']
    table_name = os.environ['DYNAMODB_TABLE']
    
    # Initialize DynamoDB client
    dynamodb = boto3.resource('dynamodb', region_name=region)
    table = dynamodb.Table(table_name)
    
    # Handle different HTTP methods
    http_method = event.get('httpMethod', 'POST')
    
    if http_method == 'GET':
        return handle_get_bookings(event, table)
    elif http_method == 'POST':
        return handle_create_booking(event, table)
    else:
        return respond(None, {
            'statusCode': 405,
            'body': json.dumps({
                'error': 'Method not allowed'
            })
        })

def handle_get_bookings(event, table):
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('user_id')
        property_id = query_params.get('property_id')
        
        if not user_id and not property_id:
            return respond(None, {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Either user_id or property_id must be provided'
                })
            })
        
        # Build query conditions
        if user_id and property_id:
            # Get bookings for specific user and property
            response = table.query(
                IndexName='UserPropertyIndex',
                KeyConditionExpression=Key('user_id').eq(user_id) & Key('property_id').eq(property_id)
            )
        elif user_id:
            # Get all bookings for a user
            response = table.query(
                IndexName='UserIndex',
                KeyConditionExpression=Key('user_id').eq(user_id)
            )
        else:
            # Get all bookings for a property using the PropertyIndex
            response = table.query(
                IndexName='PropertyIndex',
                KeyConditionExpression=Key('property_id').eq(property_id)
            )
        
        return respond(None, {
            'statusCode': 200,
            'body': json.dumps({
                'bookings': response.get('Items', []),
                'count': len(response.get('Items', []))
            }, cls=CustomJsonEncoder)
        })
        
    except Exception as e:
        return respond(None, {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        })

def handle_create_booking(event, table):
    # Parse request body
    body = json.loads(event['body'])
    property_id = body.get('property_id')
    user_id = body.get('user_id')
    check_in = body.get('check_in')
    check_out = body.get('check_out')
    guests = body.get('guests', 1)
    name = body.get('name')
    email = body.get('email')
    phone = body.get('phone')
    total_price = body.get('total_price')
    
    # Validate input
    if not all([property_id, user_id, check_in, check_out, name, email, phone, total_price]):
        return respond(None, {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Missing required fields'
            })
        })
    
    # Check for existing bookings
    try:
        response = table.query(
            IndexName='PropertyIndex',
            KeyConditionExpression=Key('property_id').eq(property_id),
            FilterExpression='#status = :status',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'confirmed'
            }
        )
        
        # Check for date conflicts
        for booking in response.get('Items', []):
            if (check_in <= booking['check_out'] and check_out >= booking['check_in']):
                return respond(None, {
                    'statusCode': 409,
                    'body': json.dumps({
                        'error': 'Property is already booked for these dates'
                    })
                })
    except Exception as e:
        return respond(None, {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        })
    
    # Create new booking
    booking_id = f"booking_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    try:
        table.put_item(
            Item={
                'booking_id': booking_id,
                'property_id': property_id,
                'user_id': user_id,
                'check_in': check_in,
                'check_out': check_out,
                'guests': guests,
                'status': 'confirmed',
                'name': name,
                'email': email,
                'phone': phone,
                'total_price': total_price,
                'created_at': datetime.now().isoformat()
            }
        )
        
        return respond(None, {
            'statusCode': 201,
            'body': json.dumps({
                'booking_id': booking_id,
                'message': 'Booking confirmed successfully'
            })
        })
    
    except Exception as e:
        return respond(None, {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        })

class CustomJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(CustomJsonEncoder, self).default(obj)

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