import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { AuthService } from './auth-service';
import { RecipeDataStore } from './recipe-data-store';

export class AlgoSpoonStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly authService: AuthService;
  public readonly recipeDataStore: RecipeDataStore;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create REST API Gateway
    this.api = new apigateway.RestApi(this, 'AlgoSpoonApi', {
      restApiName: 'AlgoSpoon API',
      description: 'API for AlgoSpoon AI recipe service',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
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

    // Create Auth Service with enhanced user profile
    this.authService = new AuthService(this, 'AuthService', {
      api: this.api,
    });

    // Create Recipe Data Store
    this.recipeDataStore = new RecipeDataStore(this, 'RecipeDataStore', {
      api: this.api,
      userTable: this.authService.userTable,
    });

    // Output API endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'AlgoSpoon API Gateway endpoint',
    });

    // Output User Table name
    new cdk.CfnOutput(this, 'UserTableName', {
      value: this.authService.userTable.tableName,
      description: 'DynamoDB User Table name',
    });

    // Output Recipe Table name
    new cdk.CfnOutput(this, 'RecipeTableName', {
      value: this.recipeDataStore.recipeTable.tableName,
      description: 'DynamoDB Recipe Table name',
    });
  }
}
