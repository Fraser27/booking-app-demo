# Luxstay - Luxury Property Booking Application Architecture

## Architecture Diagram

```mermaid
graph TD
    %% Client Side
    Client[Client Browser] --> AppRunner[AWS AppRunner]
    
    %% Frontend
    subgraph "Frontend"
        AppRunner --> ReactApp[React Application]
        ReactApp --> AmplifyAuth[Amplify Authentication]
        ReactApp --> PropertySearch[Property Search Component]
        ReactApp --> PropertyManagement[Property Management Component]
    end
    
    %% Authentication
    subgraph "Authentication"
        AmplifyAuth --> Cognito[Amazon Cognito]
        Cognito --> UserPool[User Pool]
        Cognito --> UserPoolClient[User Pool Client]
    end
    
    %% API Layer
    subgraph "API Layer"
        PropertySearch --> APIGW[API Gateway]
        PropertyManagement --> APIGW
        APIGW --> CognitoAuthorizer[Cognito Authorizer]
    end
    
    %% Backend Services
    subgraph "Backend Services"
        APIGW --> SearchLambda[Property Search Lambda]
        APIGW --> BookingLambda[Property Booking Lambda]
        
        SearchLambda --> OpenSearch[OpenSearch Serverless]
        BookingLambda --> DynamoDB[DynamoDB]
        
        SearchLambda --> S3Images[S3 Property Images]
    end
    
    %% Data Storage
    subgraph "Data Storage"
        OpenSearch --> PropertyCollection[Property Collection]
        DynamoDB --> BookingsTable[Bookings Table]
        BookingsTable --> GSI1[UserBookingsIndex]
        BookingsTable --> GSI2[PropertyBookingsIndex]
        BookingsTable --> GSI3[UserIndex]
        BookingsTable --> GSI4[UserPropertyIndex]
        BookingsTable --> GSI5[PropertyIndex]
    end
    
    %% Infrastructure as Code
    subgraph "Infrastructure as Code"
        CDK[AWS CDK] --> ApiGwStack[API Gateway Stack]
        CDK --> DynamoDBStack[DynamoDB Stack]
        CDK --> AppRunnerStack[AppRunner Stack]
        CDK --> ECRStack[ECR UI Stack]
        CDK --> OpenSearchStack[OpenSearch Vector DB Stack]
        CDK --> LambdaLayerStack[Property Layer Stack]
    end
    
    %% CI/CD
    subgraph "CI/CD"
        ECR[Amazon ECR] --> DockerImage[UI Docker Image]
        CodeBuild[AWS CodeBuild] --> ECR
        LambdaLayer[Lambda Layer] --> SearchLambda
        LambdaLayer --> BookingLambda
    end
    
    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,color:#232F3E,stroke-width:2px;
    classDef frontend fill:#61DAFB,stroke:#282C34,color:#282C34,stroke-width:2px;
    classDef database fill:#3C873A,stroke:#303030,color:#303030,stroke-width:2px;
    classDef lambda fill:#FF9900,stroke:#232F3E,color:#232F3E,stroke-width:2px;
    
    class AppRunner,Cognito,APIGW,DynamoDB,S3Images,ECR,CodeBuild,OpenSearch aws;
    class ReactApp,PropertySearch,PropertyManagement,AmplifyAuth frontend;
    class BookingsTable,PropertyCollection,GSI1,GSI2,GSI3,GSI4,GSI5 database;
    class SearchLambda,BookingLambda,LambdaLayer lambda;
```

## Architecture Overview

The Luxstay application is a luxury property booking platform built on AWS services. The architecture follows a modern serverless approach with a React frontend and AWS backend services.

### Key Components

#### Frontend
- **React Application**: A single-page application built with React, hosted on AWS AppRunner
- **Amplify Authentication**: Handles user authentication flows
- **Property Search Component**: Allows users to search for luxury properties
- **Property Management Component**: Enables property owners to manage their listings

#### Authentication
- **Amazon Cognito**: Manages user authentication and authorization
- **User Pool**: Stores user accounts and handles sign-up/sign-in
- **User Pool Client**: Client-side integration with the frontend

#### API Layer
- **API Gateway**: RESTful API interface for the frontend
- **Cognito Authorizer**: Ensures API requests are authenticated

#### Backend Services
- **Property Search Lambda**: Handles property search requests
- **Property Booking Lambda**: Processes booking requests
- **OpenSearch Serverless**: Provides fast, scalable property search capabilities
- **DynamoDB**: Stores booking data with multiple access patterns via GSIs
- **S3**: Stores property images with lifecycle management

#### Infrastructure as Code
- **AWS CDK**: Defines all infrastructure components
- **Multiple Stacks**: Organized by functionality (API, Database, Hosting, etc.)

#### CI/CD
- **Amazon ECR**: Stores Docker images for the UI
- **AWS CodeBuild**: Builds and deploys the application
- **Lambda Layers**: Provides shared code and dependencies for Lambda functions

### Data Flow

1. Users access the application through their browser, which loads the React application from AppRunner
2. Users authenticate using Cognito via the Amplify integration
3. Authenticated users can search for properties (via OpenSearch) or make bookings (stored in DynamoDB)
4. API Gateway routes requests to the appropriate Lambda functions
5. Lambda functions interact with the data stores (OpenSearch, DynamoDB, S3)
6. Property images are served from S3 with appropriate caching and lifecycle policies

### Security Considerations

- Authentication is handled by Cognito with secure password policies
- API Gateway uses Cognito authorizers to validate requests
- S3 bucket blocks public access and uses server-side encryption
- DynamoDB uses fine-grained access control
- OpenSearch collection has encryption and network policies

### Scalability

- Serverless architecture allows automatic scaling
- DynamoDB uses on-demand capacity for cost-effective scaling
- Multiple GSIs support various query patterns efficiently
- AppRunner automatically scales the frontend based on demand