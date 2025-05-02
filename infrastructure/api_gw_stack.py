from aws_cdk import (
    Stack,
    Tags,
    aws_iam as _iam,
    aws_lambda as _lambda,
    aws_ecr as _ecr, 
    aws_s3 as _s3,
    aws_cognito as _cognito,
    aws_apigateway as _apigw
)

import aws_cdk as _cdk
import os
from constructs import Construct, DependencyGroup

from infrastructure.apprunner_hosting_stack import AppRunnerHostingStack
from infrastructure.dynamodb_stack import Storage_Stack
from infrastructure.ecr_ui_stack import ECRUIStack

class ApiGw_Stack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        env_name = self.node.try_get_context("environment_name")
        env_params = self.node.try_get_context(env_name)
        region=os.getenv('CDK_DEFAULT_REGION')
        account_id = os.getenv('CDK_DEFAULT_ACCOUNT')
        collection_endpoint = 'random'
        try:
            collection_endpoint = self.node.get_context("collection_endpoint")
            collection_endpoint = collection_endpoint.replace("https://", "")
        except Exception as e:
            pass

        # Create a user pool in cognito
        user_pool = _cognito.UserPool(self, f"booking-user-pool-{env_name}",
                                      user_pool_name=env_params['booking-user-pool'],
                                      self_sign_up_enabled=True,
                                      sign_in_aliases=_cognito.SignInAliases(
                                          email=True
                                      ),
                                      standard_attributes=_cognito.StandardAttributes(
                                          email=_cognito.StandardAttribute(
                                              required=True,
                                              mutable=True
                                          )
                                      ),
                                      password_policy=_cognito.PasswordPolicy(
                                          min_length=8,
                                          require_digits=True,
                                          require_lowercase=True,
                                          require_uppercase=True,
                                          require_symbols=True
                                      )
                                      )
        
        # Create application client
        user_pool_client = _cognito.UserPoolClient(self, f"booking-user-pool-client-{env_name}",
                                                    user_pool=user_pool,
                                                    user_pool_client_name=f"booking-user-pool-client-{env_name}",
                                                    generate_secret=False,
                                                    auth_flows=_cognito.AuthFlow(
                                                       user_password=True,
                                                       user_srp=True
                                                    ),
                                                    id_token_validity=_cdk.Duration.days(1)
                                                   )

        # Create API Gateway authorizer
        cognito_authorizer = _cdk.aws_apigateway.CognitoUserPoolsAuthorizer(self, f"booking-cognito-authrzr-{env_name}",
                                                                            cognito_user_pools=[user_pool], 
                                                                            authorizer_name=env_params["booking-cognito"])

        bucket_name = f'{env_params["s3_images_data"]}-{account_id}-{region}'

        # Define API
        api_description = "Luxury Property Booking API"

        booking_api = _cdk.aws_apigateway.RestApi(
            self,
            f"property-booking-api-{env_name}",
            deploy=True,
            endpoint_types=[_cdk.aws_apigateway.EndpointType.REGIONAL],
            deploy_options={
                "stage_name": env_name,
                "throttling_rate_limit": 1000,
                "description": env_name + " stage deployment",
            },
            description=api_description,
        )

        parent_path='properties'
        properties_api = booking_api.root.add_resource(parent_path)
        rest_endpoint_url = f'https://{booking_api.rest_api_id}.execute-api.{region}.amazonaws.com/{env_name}/{parent_path}/'
        
        method_responses = [
            {
                "statusCode": "200",
                "responseParameters": {
                    "method.response.header.Content-Type": True,
                    "method.response.header.Access-Control-Allow-Origin": True,
                    "method.response.header.Access-Control-Allow-Credentials": True,
                },
            }
        ]

        custom_lambda_role = _iam.Role(self, f'booking-lambda-role_{env_name}', 
                    role_name= env_params['lambda_role_name'] + '_' + region,
                    assumed_by= _iam.ServicePrincipal('lambda.amazonaws.com'),
                    managed_policies= [
                        _iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
                    ]
                )

        # Create Lambda layer for additional libraries
        additional_libs_layer = _lambda.LayerVersion.from_layer_version_arn(
            self, 'AdditionalLibsLayer',
            layer_version_arn=f"arn:aws:lambda:{self.region}:{self.account}:layer:{self.node.try_get_context(f'{env_name}')['addtional_libs_layer_name']}:1"
        )

        # Add property search Lambda function
        property_search_lambda = _lambda.Function(self, f'property-search-{env_name}',
                              function_name=f'property-search-{env_name}',
                              code = _cdk.aws_lambda.Code.from_asset(os.path.join(os.getcwd(), 'artifacts/property_lambda/property_search/')),
                              runtime=_lambda.Runtime.PYTHON_3_10,
                              handler="search.handler",
                              role=custom_lambda_role,
                              timeout=_cdk.Duration.seconds(300),
                              description="Search luxury properties",
                              environment={ 
                                'OPENSEARCH_ENDPOINT': collection_endpoint,
                                'REGION': region,
                                'S3_BUCKET_NAME': bucket_name,
                                'INDEX_NAME': env_params['index_name']
                              },
                              memory_size=1024,
                              layers= [additional_libs_layer]
                            )

        # Add property booking Lambda function
        property_booking_lambda = _lambda.Function(self, f'property-booking-{env_name}',
                              function_name=f'property-booking-{env_name}',
                              code = _cdk.aws_lambda.Code.from_asset(os.path.join(os.getcwd(), 'artifacts/property_lambda/property_booking/')),
                              runtime=_lambda.Runtime.PYTHON_3_10,
                              handler="booking.handler",
                              role=custom_lambda_role,
                              timeout=_cdk.Duration.seconds(300),
                              description="Handle property bookings",
                              environment={ 
                                'REGION': region,
                                'DYNAMODB_TABLE': env_params['bookings_table_name']
                              },
                              memory_size=1024
                            )

        # Add Lambda integrations
        property_search_integration = _cdk.aws_apigateway.LambdaIntegration(
            property_search_lambda, proxy=True, allow_test_invoke=True)
        
        property_booking_integration = _cdk.aws_apigateway.LambdaIntegration(
            property_booking_lambda, proxy=True, allow_test_invoke=True)

        # Add API endpoints
        search_api = properties_api.add_resource("search")
        booking_api = properties_api.add_resource("booking")

        search_api.add_method("POST", property_search_integration)
        booking_api.add_method("POST", property_booking_integration)

        # Add CORS options
        self.add_cors_options(search_api)
        self.add_cors_options(booking_api)

        # Output user pool details
        user_pool_client_id = user_pool_client.user_pool_client_id
        user_pool_id = user_pool.user_pool_id
        
        _cdk.CfnOutput(self, f"booking-user-poolid-output-{env_name}", value=user_pool_id,
                       export_name="user-pool-id")
        _cdk.CfnOutput(self, f"booking-auth-clientid-output-{env_name}", value=user_pool_client_id,
                       export_name="client-id")
        
        # Create UI stack
        ecr_ui_stack = ECRUIStack(self, f"ECRUI{env_name}Stack", user_pool_id, user_pool_client_id, rest_endpoint_url) 
        self.tag_my_stack(ecr_ui_stack)

        # Create storage stack
        storage_stack = Storage_Stack(self, f"Storage{env_name}Stack")
        self.tag_my_stack(storage_stack)

        # Create property indexing Lambda function
        property_indexing_lambda = _lambda.Function(
            self, 'PropertyIndexingLambda',
            function_name=f'property-index-{env_name}',
            runtime=_lambda.Runtime.PYTHON_3_10,
            handler='index.handler',
            code=_lambda.Code.from_asset('artifacts/property_lambda/property_indexing'),
            environment={
                'REGION': region,
                'OPENSEARCH_ENDPOINT': collection_endpoint,
                'INDEX_NAME': env_params['index_name'],
                'S3_BUCKET': env_params['s3_images_data']
            },
            role=custom_lambda_role,
            layers=[additional_libs_layer]
        )

        # Add S3 permissions to the Lambda role
        custom_lambda_role.add_to_policy(
            _iam.PolicyStatement(
                actions=[
                    's3:PutObject',
                    's3:GetObject',
                    's3:GeneratePresignedUrl'
                ],
                resources=[f"arn:aws:s3:::{self.node.try_get_context(f'{env_name}')['s3_images_data']}/*"]
            )
        )

        # Add OpenSearch permissions to the Lambda role
        custom_lambda_role.add_to_policy(
            _iam.PolicyStatement(
                actions=[
                    'aoss:APIAccessAll'
                ],
                resources=['*']
            )
        )

        # Add property indexing endpoint
        properties_api.add_method(
            'POST',
            _apigw.LambdaIntegration(property_indexing_lambda),
            authorizer=cognito_authorizer,
            authorization_type=_apigw.AuthorizationType.COGNITO
        )
        self.add_cors_options(properties_api)

    def tag_my_stack(self, stack):
        tags = Tags.of(stack)
        tags.add("project", "luxury-property-booking")

    def add_cors_options(self, apiResource: _cdk.aws_apigateway.IResource):
        apiResource.add_method(
            "OPTIONS",
            _cdk.aws_apigateway.MockIntegration(
                integration_responses=[
                    {
                        "statusCode": "200",
                        "responseParameters": {
                            "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                            "method.response.header.Access-Control-Allow-Credentials": "'false'",
                            "method.response.header.Access-Control-Allow-Methods": "'OPTIONS,GET,PUT,POST,DELETE'",
                        },
                    }
                ],
                passthrough_behavior=_cdk.aws_apigateway.PassthroughBehavior.NEVER,
                request_templates={"application/json": '{"statusCode": 200}'},
            ),
            method_responses=[
                {
                    "statusCode": "200",
                    "responseParameters": {
                        "method.response.header.Access-Control-Allow-Headers": True,
                        "method.response.header.Access-Control-Allow-Methods": True,
                        "method.response.header.Access-Control-Allow-Credentials": True,
                        "method.response.header.Access-Control-Allow-Origin": True,
                    },
                }
            ],
            authorization_type=_cdk.aws_apigateway.AuthorizationType.NONE
        )