import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { AuthService } from './auth-service';
import { RecipeDataStore } from './recipe-data-store';
import { BedrockService } from './bedrock-service';
import { Monitoring } from './monitoring';
import { FrontendDeployment } from './frontend-deployment';
import { Waf } from './waf';
import { EnvironmentConfig } from './config';

export interface AlgoSpoonStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class AlgoSpoonStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly authService: AuthService;
  public readonly recipeDataStore: RecipeDataStore;
  public readonly bedrockService: BedrockService;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly monitoring?: Monitoring;
  public readonly frontendDeployment?: FrontendDeployment;
  public readonly waf?: Waf;

  constructor(scope: Construct, id: string, props: AlgoSpoonStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'AlgoSpoonUserPool', {
      userPoolName: `AlgoSpoonUsers-${config.environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: false,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: config.dynamodb.removalPolicy,
    });

    // Create User Pool Client for web app
    this.userPoolClient = new cognito.UserPoolClient(this, 'AlgoSpoonUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `AlgoSpoonWebClient-${config.environment}`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
    });

    // Create Cognito Authorizer for API Gateway
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'AlgoSpoonAuthorizer', {
      cognitoUserPools: [this.userPool],
      authorizerName: `AlgoSpoonCognitoAuthorizer-${config.environment}`,
      identitySource: 'method.request.header.Authorization',
    });

    // Create REST API Gateway
    this.api = new apigateway.RestApi(this, 'AlgoSpoonApi', {
      restApiName: `AlgoSpoon-API-${config.environment}`,
      description: `API for AlgoSpoon AI recipe service (${config.environment})`,
      deployOptions: {
        stageName: config.environment,
        loggingLevel: config.apiGateway.loggingLevel === 'INFO' 
          ? apigateway.MethodLoggingLevel.INFO 
          : config.apiGateway.loggingLevel === 'ERROR'
          ? apigateway.MethodLoggingLevel.ERROR
          : apigateway.MethodLoggingLevel.OFF,
        dataTraceEnabled: config.monitoring.enableDetailedMetrics,
        metricsEnabled: true,
        throttlingRateLimit: config.apiGateway.throttle.rateLimit,
        throttlingBurstLimit: config.apiGateway.throttle.burstLimit,
      },
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
    });

    // Create shared API Gateway resources
    const recipesResource = this.api.root.addResource('recipes');

    // Create Auth Service with enhanced user profile
    this.authService = new AuthService(this, 'AuthService', {
      api: this.api,
    });

    // Create Recipe Data Store
    this.recipeDataStore = new RecipeDataStore(this, 'RecipeDataStore', {
      api: this.api,
      userTable: this.authService.userTable,
      recipesResource,
    });

    // Create Bedrock Service with AI capabilities
    this.bedrockService = new BedrockService(this, 'BedrockService', {
      api: this.api,
      userTable: this.authService.userTable,
      recipeTable: this.recipeDataStore.recipeTable,
      recipesResource,
      authorizer,
    });

    // Collect all Lambda functions for monitoring
    const allLambdaFunctions = [
      this.authService.registerFunction,
      this.authService.updateProfileFunction,
      this.authService.getUserFunction,
      this.recipeDataStore.saveRecipeFunction,
      this.recipeDataStore.getRecipesFunction,
      this.recipeDataStore.deleteRecipeFunction,
      this.bedrockService.recipeGeneratorFunction,
      this.bedrockService.mealPlansFunction,
      this.bedrockService.mealPlanWorkerFunction,
    ];

    // Collect all DynamoDB tables
    const allDynamoTables = [
      this.authService.userTable,
      this.recipeDataStore.recipeTable,
      this.bedrockService.mealPlansTable,
    ];

    // Create Monitoring with CloudWatch alarms
    if (config.monitoring.enableDetailedMetrics) {
      this.monitoring = new Monitoring(this, 'Monitoring', {
        api: this.api,
        lambdaFunctions: allLambdaFunctions,
        dynamoTables: allDynamoTables,
        alarmEmail: config.monitoring.alarmEmail,
      });
    }

    // Create WAF for API protection
    if (config.waf.enabled) {
      this.waf = new Waf(this, 'Waf', {
        api: this.api,
        rateLimit: config.waf.rateLimit,
      });
    }

    // Deploy frontend to S3 + CloudFront
    if (config.frontend.deployFrontend) {
      this.frontendDeployment = new FrontendDeployment(this, 'FrontendDeployment', {
        buildPath: './frontend/dist',
        domainName: config.frontend.customDomain?.domainName,
        certificateArn: config.frontend.customDomain?.certificateArn,
      });
    }

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'Environment', {
      value: config.environment,
      description: 'Deployment Environment',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'AlgoSpoon API Gateway endpoint',
      exportName: `AlgoSpoonApiEndpoint-${config.environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `AlgoSpoonUserPoolId-${config.environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `AlgoSpoonUserPoolClientId-${config.environment}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: `AlgoSpoonRegion-${config.environment}`,
    });

    new cdk.CfnOutput(this, 'UserTableName', {
      value: this.authService.userTable.tableName,
      description: 'DynamoDB User Table name',
    });

    new cdk.CfnOutput(this, 'RecipeTableName', {
      value: this.recipeDataStore.recipeTable.tableName,
      description: 'DynamoDB Recipe Table name',
    });

    new cdk.CfnOutput(this, 'MealPlansTableName', {
      value: this.bedrockService.mealPlansTable.tableName,
      description: 'DynamoDB Meal Plans Table name',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.bedrockService.eventBus.eventBusName,
      description: 'EventBridge Event Bus name',
    });

    if (this.monitoring) {
      new cdk.CfnOutput(this, 'DashboardURL', {
        value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.monitoring.dashboard.dashboardName}`,
        description: 'CloudWatch Dashboard URL',
      });
    }

    // Tag all resources
    cdk.Tags.of(this).add('Project', 'AlgoSpoon');
    cdk.Tags.of(this).add('Environment', config.environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}

