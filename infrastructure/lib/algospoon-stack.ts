import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class AlgoSpoonStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables
    // ========================================

    // Auth Table - stores user profiles with dietary restrictions and allergies
    const authTable = new dynamodb.Table(this, 'AuthTable', {
      tableName: 'AlgoSpoonAuthTable',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Meal Plans Table - stores generated meal plans
    const mealPlansTable = new dynamodb.Table(this, 'MealPlansTable', {
      tableName: 'AlgoSpoonMealPlansTable',
      partitionKey: {
        name: 'planId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for querying plans by userId
    mealPlansTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Recipes Table - stores individual recipes from meal plans
    const recipesTable = new dynamodb.Table(this, 'RecipesTable', {
      tableName: 'AlgoSpoonRecipesTable',
      partitionKey: {
        name: 'recipeId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for querying recipes by planId
    recipesTable.addGlobalSecondaryIndex({
      indexName: 'PlanIdIndex',
      partitionKey: {
        name: 'planId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'day',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================
    // EventBridge Event Bus
    // ========================================

    const eventBus = new events.EventBus(this, 'AlgoSpoonEventBus', {
      eventBusName: 'AlgoSpoonEventBus',
    });

    // ========================================
    // IAM Role for Lambda Functions
    // ========================================

    // Bedrock access policy
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: [
        `arn:aws:bedrock:${this.region}::foundation-model/*`,
      ],
    });

    // ========================================
    // Lambda Functions
    // ========================================

    // AI Chat API - Recipe Generator
    const aiChatApiFunction = new lambda.Function(this, 'AIChatApiFunction', {
      functionName: 'AlgoSpoon-AIChatApi',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/functions/recipe-generator'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        AUTH_TABLE_NAME: authTable.tableName,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
        AWS_REGION: this.region,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to AI Chat API
    authTable.grantReadData(aiChatApiFunction);
    aiChatApiFunction.addToRolePolicy(bedrockPolicy);

    // Business API - Meal Plan Management
    const businessApiFunction = new lambda.Function(this, 'BusinessApiFunction', {
      functionName: 'AlgoSpoon-BusinessApi',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/functions/meal-plans'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName,
        PLANS_TABLE_NAME: mealPlansTable.tableName,
        RECIPES_TABLE_NAME: recipesTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to Business API
    mealPlansTable.grantReadWriteData(businessApiFunction);
    recipesTable.grantReadData(businessApiFunction);
    eventBus.grantPutEventsTo(businessApiFunction);

    // Business Worker - Async Meal Plan Generator
    const businessWorkerFunction = new lambda.Function(this, 'BusinessWorkerFunction', {
      functionName: 'AlgoSpoon-BusinessWorker',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/functions/meal-plan-worker'),
      timeout: cdk.Duration.minutes(15), // Long timeout for complex meal plan generation
      memorySize: 2048,
      environment: {
        AUTH_TABLE_NAME: authTable.tableName,
        PLANS_TABLE_NAME: mealPlansTable.tableName,
        RECIPES_TABLE_NAME: recipesTable.tableName,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
        AWS_REGION: this.region,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to Business Worker
    authTable.grantReadData(businessWorkerFunction);
    mealPlansTable.grantReadWriteData(businessWorkerFunction);
    recipesTable.grantWriteData(businessWorkerFunction);
    businessWorkerFunction.addToRolePolicy(bedrockPolicy);

    // ========================================
    // EventBridge Rules
    // ========================================

    // Rule to trigger Business Worker on plan generation requests
    const planGenerateRule = new events.Rule(this, 'PlanGenerateRule', {
      eventBus: eventBus,
      eventPattern: {
        source: ['algospoon.business-api'],
        detailType: ['plan.generate.requested'],
      },
      description: 'Triggers Business Worker when a meal plan generation is requested',
    });

    planGenerateRule.addTarget(new targets.LambdaFunction(businessWorkerFunction, {
      retryAttempts: 2,
    }));

    // ========================================
    // API Gateway
    // ========================================

    // REST API
    const api = new apigateway.RestApi(this, 'AlgoSpoonApi', {
      restApiName: 'AlgoSpoon API',
      description: 'AlgoSpoon AI Recipe and Meal Planning API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Create authorizer (placeholder - would typically use Cognito)
    // For now, we'll use IAM authorization or API Key

    // AI Chat API endpoints
    const recipesResource = api.root.addResource('recipes');
    const generateRecipeResource = recipesResource.addResource('generate');
    
    generateRecipeResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(aiChatApiFunction),
      {
        apiKeyRequired: false, // Set to true in production
      }
    );

    // Business API endpoints
    const plansResource = api.root.addResource('plans');
    
    // POST /plans/generate
    const generatePlanResource = plansResource.addResource('generate');
    generatePlanResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(businessApiFunction),
      {
        apiKeyRequired: false,
      }
    );

    // GET /plans
    plansResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(businessApiFunction),
      {
        apiKeyRequired: false,
      }
    );

    // GET /plans/{planId}
    const planIdResource = plansResource.addResource('{planId}');
    planIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(businessApiFunction),
      {
        apiKeyRequired: false,
      }
    );

    // Profile API endpoints (for user dietary preferences)
    const profileResource = api.root.addResource('profile');
    const userProfileResource = profileResource.addResource('{userId}');
    
    // GET /profile/{userId}
    userProfileResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(new lambda.Function(this, 'GetProfileFunction', {
        functionName: 'AlgoSpoon-GetProfile',
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
          const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
          
          const client = new DynamoDBClient({});
          const docClient = DynamoDBDocumentClient.from(client);
          
          exports.handler = async (event) => {
            const userId = event.pathParameters.userId;
            
            const response = await docClient.send(new GetCommand({
              TableName: process.env.AUTH_TABLE_NAME,
              Key: { userId },
            }));
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify(response.Item || {}),
            };
          };
        `),
        environment: {
          AUTH_TABLE_NAME: authTable.tableName,
        },
      })),
    );

    // PUT /profile/{userId}
    userProfileResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(new lambda.Function(this, 'UpdateProfileFunction', {
        functionName: 'AlgoSpoon-UpdateProfile',
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
          const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
          
          const client = new DynamoDBClient({});
          const docClient = DynamoDBDocumentClient.from(client);
          
          exports.handler = async (event) => {
            const userId = event.pathParameters.userId;
            const profile = JSON.parse(event.body);
            
            await docClient.send(new PutCommand({
              TableName: process.env.AUTH_TABLE_NAME,
              Item: {
                userId,
                ...profile,
                updatedAt: new Date().toISOString(),
              },
            }));
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ success: true }),
            };
          };
        `),
        environment: {
          AUTH_TABLE_NAME: authTable.tableName,
        },
      })),
    );

    // Grant table permissions to profile functions
    const getProfileFunction = this.node.findChild('GetProfileFunction') as lambda.Function;
    const updateProfileFunction = this.node.findChild('UpdateProfileFunction') as lambda.Function;
    authTable.grantReadData(getProfileFunction);
    authTable.grantWriteData(updateProfileFunction);

    // ========================================
    // S3 Bucket for Frontend Hosting
    // ========================================

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `algospoon-frontend-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // CloudFront Origin Access Identity
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for AlgoSpoon website',
    });

    websiteBucket.grantRead(oai);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'AlgoSpoonApiEndpoint',
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
      exportName: 'AlgoSpoonWebsiteURL',
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket name for website hosting',
      exportName: 'AlgoSpoonWebsiteBucket',
    });

    new cdk.CfnOutput(this, 'AuthTableName', {
      value: authTable.tableName,
      description: 'DynamoDB Auth Table name',
      exportName: 'AlgoSpoonAuthTable',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus name',
      exportName: 'AlgoSpoonEventBus',
    });
  }
}
