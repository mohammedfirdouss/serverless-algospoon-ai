import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface BedrockServiceProps {
  api: apigateway.RestApi;
  userTable: dynamodb.Table;
  recipeTable: dynamodb.Table;
  recipesResource: apigateway.Resource;
  authorizer?: apigateway.IAuthorizer;
}

export class BedrockService extends Construct {
  public readonly mealPlansTable: dynamodb.Table;
  public readonly recipeGeneratorFunction: lambda.Function;
  public readonly mealPlansFunction: lambda.Function;
  public readonly mealPlanWorkerFunction: lambda.Function;
  public readonly eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props: BedrockServiceProps) {
    super(scope, id);

    // Create DynamoDB table for meal plans
    this.mealPlansTable = new dynamodb.Table(this, 'MealPlansTable', {
      tableName: 'AlgoSpoonMealPlans',
      partitionKey: {
        name: 'planId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for querying by userId
    this.mealPlansTable.addGlobalSecondaryIndex({
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

    // Create EventBridge Event Bus
    this.eventBus = new events.EventBus(this, 'AlgoSpoonEventBus', {
      eventBusName: 'AlgoSpoonEventBus',
    });

    // Create Bedrock IAM policy for Claude models
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: [
        `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
        `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
      ],
    });

    // Lambda function for recipe generation with Bedrock
    this.recipeGeneratorFunction = new lambda.Function(this, 'RecipeGeneratorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/functions/recipe-generator')),
      environment: {
        AUTH_TABLE_NAME: props.userTable.tableName,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Generates recipes using AWS Bedrock Claude',
    });

    // Grant Bedrock permissions
    this.recipeGeneratorFunction.addToRolePolicy(bedrockPolicy);
    props.userTable.grantReadData(this.recipeGeneratorFunction);

    // Lambda function for meal plans orchestration
    this.mealPlansFunction = new lambda.Function(this, 'MealPlansFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/functions/meal-plans')),
      environment: {
        EVENT_BUS_NAME: this.eventBus.eventBusName,
        PLANS_TABLE_NAME: this.mealPlansTable.tableName,
        RECIPES_TABLE_NAME: props.recipeTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Orchestrates meal plan generation requests',
    });

    // Grant permissions
    this.mealPlansTable.grantReadWriteData(this.mealPlansFunction);
    props.recipeTable.grantReadData(this.mealPlansFunction);
    this.eventBus.grantPutEventsTo(this.mealPlansFunction);

    // Lambda function for meal plan worker (EventBridge triggered)
    this.mealPlanWorkerFunction = new lambda.Function(this, 'MealPlanWorkerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/functions/meal-plan-worker')),
      environment: {
        AUTH_TABLE_NAME: props.userTable.tableName,
        PLANS_TABLE_NAME: this.mealPlansTable.tableName,
        RECIPES_TABLE_NAME: props.recipeTable.tableName,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: 2048,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Processes meal plan generation using Bedrock',
    });

    // Grant Bedrock permissions
    this.mealPlanWorkerFunction.addToRolePolicy(bedrockPolicy);
    props.userTable.grantReadData(this.mealPlanWorkerFunction);
    this.mealPlansTable.grantReadWriteData(this.mealPlanWorkerFunction);
    props.recipeTable.grantReadWriteData(this.mealPlanWorkerFunction);

    // Create EventBridge rule for meal plan generation
    const planGenerateRule = new events.Rule(this, 'PlanGenerateRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['algospoon.business-api'],
        detailType: ['plan.generate.requested'],
      },
      description: 'Triggers meal plan worker when plan generation is requested',
    });

    // Add Lambda as target
    planGenerateRule.addTarget(new targets.LambdaFunction(this.mealPlanWorkerFunction, {
      retryAttempts: 2,
    }));

    // Create API Gateway resources using passed resource
    const recipesResource = props.recipesResource;
    const plansResource = props.api.root.addResource('plans');

    // POST /recipes/generate - Generate recipe with Bedrock
    const generateRecipeResource = recipesResource.addResource('generate');
    generateRecipeResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.recipeGeneratorFunction),
      {
        authorizer: props.authorizer,
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '400' },
          { statusCode: '500' },
        ],
      }
    );

    // POST /plans/generate - Initiate meal plan generation
    const generatePlanResource = plansResource.addResource('generate');
    generatePlanResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.mealPlansFunction),
      {
        authorizer: props.authorizer,
        methodResponses: [
          { statusCode: '202' },
          { statusCode: '400' },
          { statusCode: '500' },
        ],
      }
    );

    // GET /plans - List user's meal plans
    plansResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.mealPlansFunction),
      {
        authorizer: props.authorizer,
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '500' },
        ],
      }
    );

    // GET /plans/{planId} - Get specific meal plan
    const planIdResource = plansResource.addResource('{planId}');
    planIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.mealPlansFunction),
      {
        authorizer: props.authorizer,
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '403' },
          { statusCode: '404' },
          { statusCode: '500' },
        ],
      }
    );
  }
}
