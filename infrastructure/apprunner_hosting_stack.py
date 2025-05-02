from aws_cdk import (
    Stack,
    Tags,
    aws_apprunner as _apprunner,
    aws_iam as _iam
)

import aws_cdk as _cdk
import os
from constructs import Construct
import cdk_nag as _cdk_nag
from cdk_nag import NagSuppressions, NagPackSuppression

class AppRunnerHostingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.stack_level_suppressions()
        env_name = self.node.try_get_context("environment_name")
        env_params = self.node.try_get_context(env_name)
        region=os.getenv('CDK_DEFAULT_REGION')
        account_id = os.getenv('CDK_DEFAULT_ACCOUNT')

        # Create IAM role for AppRunner
        apprunner_role = _iam.Role(
            self,
            f"property-booking-apprunner-role-{env_name}",
            assumed_by=_iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
            description="Role for AppRunner to access ECR and other services"
        )

        # Add ECR permissions to AppRunner role
        apprunner_role.add_to_policy(
            _iam.PolicyStatement(
                actions=[
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage"
                ],
                resources=["*"]
            )
        )

        # Create AppRunner service
        apprunner_service = _apprunner.CfnService(
            self,
            f"property-booking-ui-{env_name}",
            service_name=env_params['apprunner_service_name'],
            source_configuration=_apprunner.CfnService.SourceConfigurationProperty(
                authentication_configuration=_apprunner.CfnService.AuthenticationConfigurationProperty(
                    access_role_arn=apprunner_role.role_arn
                ),
                image_repository=_apprunner.CfnService.ImageRepositoryProperty(
                    image_identifier=f"{account_id}.dkr.ecr.{region}.amazonaws.com/{env_params['ecr_repository_name']}:latest",
                    image_repository_type="ECR",
                    image_configuration=_apprunner.CfnService.ImageConfigurationProperty(
                        port="80",
                        runtime_environment_variables=[_apprunner.CfnService.KeyValuePairProperty(
                                           name="name",
                                           value="value")]
                    )
                )
            ),
            instance_configuration=_apprunner.CfnService.InstanceConfigurationProperty(
                cpu="1 vCPU",
                memory="2 GB"
            )
        )

        # Output AppRunner service URL
        _cdk.CfnOutput(self, f"property-booking-ui-url-{env_name}", 
                      value=f"https://{apprunner_service.attr_service_url}",
                      export_name="apprunner-service-url")

    def tag_my_stack(self, stack):
        tags = Tags.of(stack)
        tags.add("project", "luxury-property-booking")

    def stack_level_suppressions(self):
        NagSuppressions.add_stack_suppressions(self, [
            _cdk_nag.NagPackSuppression(id='AwsSolutions-IAM5', reason='Basic ECR access role'),
            _cdk_nag.NagPackSuppression(id='AwsSolutions-IAM4', reason='Basic ECR access role')
        ])