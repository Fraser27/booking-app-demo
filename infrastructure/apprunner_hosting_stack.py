from aws_cdk import (
    Stack,
    Tags,
    aws_apprunner as _apprunner,
    aws_iam as _iam
)

import aws_cdk as _cdk
import os
from constructs import Construct


class AppRunnerHostingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        env_name = self.node.try_get_context("environment_name")
        config_details = self.node.try_get_context(env_name)
        region=os.getenv('CDK_DEFAULT_REGION')
        account_id = os.getenv('CDK_DEFAULT_ACCOUNT')
        current_timestamp = self.node.try_get_context('current_timestamp')
        ecr_repo_name = config_details['ecr_repository_name']
        # Generate ECR Full repo name
        full_ecr_repo_name = f'{account_id}.dkr.ecr.{region}.amazonaws.com/{ecr_repo_name}:{current_timestamp}'
        

        apprunner_role = _iam.Role(self, f"rag-llm-role-{env_name}",
                  assumed_by=_iam.ServicePrincipal("build.apprunner.amazonaws.com"),
                )
        
        apprunner_role.add_to_policy(_iam.PolicyStatement(
                    actions=["ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability",
                            "ecr:BatchGetImage", "ecr:DescribeImages", "ecr:GetAuthorizationToken"],
                    resources=["*"],
                    effect=_iam.Effect.ALLOW
        ))

        

        # Create AppRunner service
        apprunner_service = _apprunner.CfnService(self, f"property-booking-ui-{env_name}",
                            instance_configuration=_apprunner.CfnService.InstanceConfigurationProperty(
                            cpu="2048",
                            memory="4096"
                            ),
                            service_name=config_details['apprunner_service_name'],
                            source_configuration=_apprunner.CfnService.SourceConfigurationProperty(
                                auto_deployments_enabled=True,
                                authentication_configuration=_apprunner.CfnService.AuthenticationConfigurationProperty(
                                    access_role_arn=apprunner_role.role_arn
                                ),
                                image_repository=_apprunner.CfnService.ImageRepositoryProperty(
                                   image_identifier=full_ecr_repo_name,
                                   image_repository_type="ECR",
                                   image_configuration=_apprunner.CfnService.ImageConfigurationProperty(
                                       port="80", 
                                       runtime_environment_variables=[_apprunner.CfnService.KeyValuePairProperty(
                                           name="name",
                                           value="value")],)))
                           )

        # Output AppRunner service URL
        _cdk.CfnOutput(self, f"property-booking-ui-url-{env_name}", 
                      value=f"https://{apprunner_service.attr_service_url}",
                      export_name="apprunner-service-url")

    def tag_my_stack(self, stack):
        tags = Tags.of(stack)
        tags.add("project", "luxury-property-booking")
