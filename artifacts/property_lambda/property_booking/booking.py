import json
import os
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key

def handler(event, context):
    # Get environment variables
    region = os.environ['REGION']
    table_name = os.environ['DYNAMODB_TABLE']
    
    # Initialize DynamoDB client
    dynamodb = boto3.resource('dynamodb', region_name=region)
    table = dynamodb.Table(table_name)
    
    # Parse request body
    body = json.loads(event['body'])
    property_id = body.get('property_id')
    user_id = body.get('user_id')
    check_in = body.get('check_in')
    check_out = body.get('check_out')
    guests = body.get('guests', 1)
    
    # Validate input
    if not all([property_id, user_id, check_in, check_out]):
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({
                'error': 'Missing required fields'
            })
        }
    
    # Check for existing bookings
    try:
        response = table.query(
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
                return {
                    'statusCode': 409,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Credentials': True,
                    },
                    'body': json.dumps({
                        'error': 'Property is already booked for these dates'
                    })
                }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
    
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
                'created_at': datetime.now().isoformat()
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({
                'booking_id': booking_id,
                'message': 'Booking confirmed successfully'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({
                'error': str(e)
            })
        } 