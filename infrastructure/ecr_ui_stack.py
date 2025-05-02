import json
from aws_cdk import (
    Stack,
    Tags,
    aws_ecr as _ecr,
    RemovalPolicy
)

import aws_cdk as _cdk
import os
from constructs import Construct
import cdk_nag as _cdk_nag
from cdk_nag import NagSuppressions, NagPackSuppression

# This stack will dockerize the latest UI build and upload it to ECR
class ECRUIStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, user_pool_id: str, user_pool_client_id: str, rest_endpoint_url: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.stack_level_suppressions()
        env_name = self.node.try_get_context("environment_name")
        env_params = self.node.try_get_context(env_name)
        region=os.getenv('CDK_DEFAULT_REGION')
        account_id = os.getenv('CDK_DEFAULT_ACCOUNT')

        # Create ECR repository for UI
        ecr_repository = _ecr.Repository(
            self, 
            f"property-booking-ui-{env_name}",
            repository_name=env_params['ecr_repository_name'],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_images=True
        )

        # Output ECR repository URI
        _cdk.CfnOutput(self, f"property-booking-ui-ecr-uri-{env_name}", 
                      value=ecr_repository.repository_uri,
                      export_name="ecr-repository-uri")

    def tag_my_stack(self, stack):
        tags = Tags.of(stack)
        tags.add("project", "luxury-property-booking")

    def stack_level_suppressions(self):
        NagSuppressions.add_stack_suppressions(self, [
            _cdk_nag.NagPackSuppression(id='AwsSolutions-ECR1', reason='Repository is used for development'),
            _cdk_nag.NagPackSuppression(id='AwsSolutions-ECR2', reason='Repository is used for development')
        ])


        
