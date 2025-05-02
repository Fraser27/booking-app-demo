from aws_cdk import (
    Stack,
    Tags,
    aws_iam as _iam,
    aws_opensearchserverless as _aoss
)

import aws_cdk as _cdk
import os
from constructs import Construct

class OpensearchVectorDbStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        env_name = self.node.try_get_context("environment_name")
        env_params = self.node.try_get_context(env_name)
        region=os.getenv('CDK_DEFAULT_REGION')
        account_id = os.getenv('CDK_DEFAULT_ACCOUNT')
        collection_name = env_params['collection_name']
        lambda_role_arn = f"arn:aws:iam::{account_id}:role/{env_params['lambda_role_name']}_{region}"
        
        # Create OpenSearch collection
        collection = _aoss.CfnCollection(
            self, 
            f"property-collection-{env_name}",
            name=collection_name,
            type="SEARCH",
            description="Collection for storing luxury property data"
        )

        # Create encryption policy
        encryption_policy = _aoss.CfnSecurityPolicy(self, f'prop-colln-db-encrypt-{env_name}', 
                                    name=f'prop-colln-db-encrypt-{env_name}',
                                type='encryption',
                                policy="""{\"Rules\":[{\"ResourceType\":\"collection\",\"Resource\":[\"collection/"""+ collection_name +"""\"]}],\"AWSOwnedKey\":true}""")
        
        network_policy = _aoss.CfnSecurityPolicy(self, f'prop-colln-nw-{env_name}', 
                                                name=f'prop-colln-nw-{env_name}',
                                type='network',
                                policy="""[{\"Rules\":[{\"ResourceType\":\"collection\",\"Resource\":[\"collection/"""+ collection_name + """\"]}, {\"ResourceType\":\"dashboard\",\"Resource\":[\"collection/"""+ collection_name + """\"]}],\"AllowFromPublic\":true}]""")

        data_access_policy = _aoss.CfnAccessPolicy(self, f'prop-colln-data-{env_name}', name=f'prop-colln-data-{env_name}',
                                type='data',
                                policy="""[{\"Rules\":[{\"ResourceType\":\"index\",\"Resource\":[\"index/"""+ collection_name +"""/*\"], \"Permission\": [\"aoss:*\"]}, {\"ResourceType\":\"collection\",\"Resource\":[\"collection/"""+ collection_name +"""\"], \"Permission\": [\"aoss:*\"]}], \"Principal\": [\"""" + lambda_role_arn + """\", \"arn:aws:iam::"""+ account_id +""":root\"]}]""")
        
        
        
        

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

        
