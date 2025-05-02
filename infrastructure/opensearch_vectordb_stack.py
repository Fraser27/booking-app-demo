from aws_cdk import (
    Stack,
    Tags,
    aws_iam as _iam,
    aws_opensearchserverless as _aoss
)

import aws_cdk as _cdk
import os
from constructs import Construct
import cdk_nag as _cdk_nag
from cdk_nag import NagSuppressions, NagPackSuppression

class OpensearchVectorDbStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.stack_level_suppressions()
        env_name = self.node.try_get_context("environment_name")
        env_params = self.node.try_get_context(env_name)
        region=os.getenv('CDK_DEFAULT_REGION')
        account_id = os.getenv('CDK_DEFAULT_ACCOUNT')

        # Create OpenSearch collection
        collection = _aoss.CfnCollection(
            self, 
            f"property-collection-{env_name}",
            name=env_params['collection_name'],
            type="SEARCH",
            description="Collection for storing luxury property data"
        )

        # Create encryption policy
        encryption_policy = _aoss.CfnSecurityPolicy(
            self,
            f"property-encryption-policy-{env_name}",
            name=f"property-encryption-policy-{env_name}",
            type="encryption",
            policy=f'''{{
                "Rules": [
                    {{
                        "Resource": [
                            "collection/{env_params['collection_name']}"
                        ],
                        "ResourceType": "collection"
                    }}
                ],
                "AWSOwnedKey": true
            }}'''
        )

        # Create network policy
        network_policy = _aoss.CfnSecurityPolicy(
            self,
            f"property-network-policy-{env_name}",
            name=f"property-network-policy-{env_name}",
            type="network",
            policy=f'''{{
                "Rules": [
                    {{
                        "Resource": [
                            "collection/{env_params['collection_name']}"
                        ],
                        "ResourceType": "collection"
                    }}
                ],
                "AllowFromPublic": true
            }}'''
        )

        # Create data access policy
        data_access_policy = _aoss.CfnAccessPolicy(
            self,
            f"property-data-access-policy-{env_name}",
            name=f"property-data-access-policy-{env_name}",
            type="data",
            policy=f'''[
                {{
                    "Rules": [
                        {{
                            "Resource": [
                                "collection/{env_params['collection_name']}"
                            ],
                            "Permission": [
                                "aoss:CreateCollectionItems",
                                "aoss:DeleteCollectionItems",
                                "aoss:UpdateCollectionItems",
                                "aoss:DescribeCollectionItems"
                            ],
                            "ResourceType": "collection"
                        }}
                    ],
                    "Principal": [
                        "arn:aws:iam::{account_id}:root"
                    ]
                }}
            ]'''
        )

        # Add dependencies
        collection.add_dependency(encryption_policy)
        collection.add_dependency(network_policy)
        collection.add_dependency(data_access_policy)

        # Output collection endpoint
        _cdk.CfnOutput(self, f"property-collection-endpoint-{env_name}", 
                      value=f"https://{collection.attr_collection_endpoint}",
                      export_name="collection-endpoint")

    def tag_my_stack(self, stack):
        tags = Tags.of(stack)
        tags.add("project", "luxury-property-booking")

    def stack_level_suppressions(self):
        NagSuppressions.add_stack_suppressions(self, [
            _cdk_nag.NagPackSuppression(id='AwsSolutions-IAM5', reason='Basic lambda execution role'),
            _cdk_nag.NagPackSuppression(id='AwsSolutions-IAM4', reason='Basic lambda execution role')
        ])
        
