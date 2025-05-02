from aws_cdk import (
    Stack,
    Tags,
    aws_dynamodb as _dynamodb,
    RemovalPolicy
)

import aws_cdk as _cdk
import os
from constructs import Construct
import cdk_nag as _cdk_nag
from cdk_nag import NagSuppressions, NagPackSuppression

class Storage_Stack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.stack_level_suppressions()
        env_name = self.node.try_get_context("environment_name")
        env_params = self.node.try_get_context(env_name)
        region=os.getenv('CDK_DEFAULT_REGION')

        # Create DynamoDB table for property bookings
        bookings_table = _dynamodb.Table(
            self, 
            f"property-bookings-table-{env_name}",
            table_name=env_params['bookings_table_name'],
            partition_key=_dynamodb.Attribute(
                name="booking_id",
                type=_dynamodb.AttributeType.STRING
            ),
            sort_key=_dynamodb.Attribute(
                name="property_id",
                type=_dynamodb.AttributeType.STRING
            ),
            billing_mode=_dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

        # Add GSI for querying bookings by user
        bookings_table.add_global_secondary_index(
            index_name="UserBookingsIndex",
            partition_key=_dynamodb.Attribute(
                name="user_id",
                type=_dynamodb.AttributeType.STRING
            ),
            sort_key=_dynamodb.Attribute(
                name="created_at",
                type=_dynamodb.AttributeType.STRING
            ),
            projection_type=_dynamodb.ProjectionType.ALL
        )

        # Add GSI for querying bookings by property
        bookings_table.add_global_secondary_index(
            index_name="PropertyBookingsIndex",
            partition_key=_dynamodb.Attribute(
                name="property_id",
                type=_dynamodb.AttributeType.STRING
            ),
            sort_key=_dynamodb.Attribute(
                name="check_in",
                type=_dynamodb.AttributeType.STRING
            ),
            projection_type=_dynamodb.ProjectionType.ALL
        )

    def tag_my_stack(self, stack):
        tags = Tags.of(stack)
        tags.add("project", "luxury-property-booking")

    def stack_level_suppressions(self):
        NagSuppressions.add_stack_suppressions(self, [
            _cdk_nag.NagPackSuppression(id='AwsSolutions-DDB3', reason='Point in time recovery is enabled'),
            _cdk_nag.NagPackSuppression(id='AwsSolutions-DDB4', reason='Using PAY_PER_REQUEST billing mode')
        ])

        