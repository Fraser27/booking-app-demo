#!/usr/bin/env python3
import os

import aws_cdk as cdk
from aws_cdk import Stack, Tags
from infrastructure.apprunner_hosting_stack import AppRunnerHostingStack
from infrastructure.ecr_ui_stack import ECRUIStack
from infrastructure.api_gw_stack import ApiGw_Stack
from infrastructure.opensearch_vectordb_stack import OpensearchVectorDbStack
from infrastructure.property_layer_stack import PropLayerStack

app = cdk.App()

def tag_my_stack(stack):
    tags = Tags.of(stack)
    tags.add("project", "luxury-property-booking")

account_id = os.getenv('CDK_DEFAULT_ACCOUNT')
region = os.getenv('CDK_DEFAULT_REGION')
env=cdk.Environment(account=account_id, region=region)

env_name = app.node.try_get_context("environment_name")

oss_stack = OpensearchVectorDbStack(app, f"PropDb{env_name}")
tag_my_stack(oss_stack)

prop_layer_stack = PropLayerStack(app, f"PropLayer{env_name}Stack")
tag_my_stack(prop_layer_stack)

api_gw_stack = ApiGw_Stack(app, f'PropApis{env_name}Stack')
tag_my_stack(api_gw_stack)
api_gw_stack.add_dependency(oss_stack)
api_gw_stack.add_dependency(prop_layer_stack)

apprunner_stack = AppRunnerHostingStack(app, f"PropRunnerHosting{env_name}Stack") 
tag_my_stack(apprunner_stack)
apprunner_stack.add_dependency(api_gw_stack)

app.synth()

