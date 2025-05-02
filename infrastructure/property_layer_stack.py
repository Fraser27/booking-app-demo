from aws_cdk import (
    NestedStack,
    Stack,
    aws_lambda as _lambda,
    aws_iam as _iam,
    aws_codebuild as _codebuild,
    aws_kms as _kms,
    Aspects
)
from constructs import Construct
import os
import yaml
import aws_cdk as _cdk

# This stack creates the  lambda layers needed for indexing/querying O
class PropLayerStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        env_name = self.node.try_get_context('environment_name')
        config_details = self.node.try_get_context(env_name)
        
        addtional_libs_layer_name = config_details["addtional_libs_layer_name"]
        account_id = os.getenv("CDK_DEFAULT_ACCOUNT")
        region = os.getenv("CDK_DEFAULT_REGION")
        
        build_spec_yml = ''
        with open("buildspec_property.yml", "r") as stream:
            try:
                build_spec_yml = yaml.safe_load(stream)
            except yaml.YAMLError as exc:
                print(exc)
        
        
        # Trigger CodeBuild job
        containerize_build_job =_codebuild.Project(
            self,
            f"proplambdalayer{env_name}",
            build_spec=_codebuild.BuildSpec.from_object_to_yaml(build_spec_yml),
            environment = _codebuild.BuildEnvironment(
            build_image=_codebuild.LinuxBuildImage.STANDARD_6_0,
            privileged=True,
            environment_variables={
                "addtional_libs_layer_name": _codebuild.BuildEnvironmentVariable(value = addtional_libs_layer_name),
                "account_id" : _codebuild.BuildEnvironmentVariable(value = account_id),
                "region": _codebuild.BuildEnvironmentVariable(value = region),
                
            })
        )

        lambda_layer_policy = _iam.PolicyStatement(actions=[
        "lambda:PublishLayerVersion"
        ], resources=["*"])
        containerize_build_job.add_to_role_policy(lambda_layer_policy)
        

        
            
        

        
        
