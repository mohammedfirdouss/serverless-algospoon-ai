import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface RecipeDataStoreProps {
  api: apigateway.RestApi;
  userTable: dynamodb.Table;
  recipesResource: apigateway.Resource;
}

export class RecipeDataStore extends Construct {
  public readonly recipeTable: dynamodb.Table;
  public readonly saveRecipeFunction: lambda.Function;
  public readonly getRecipesFunction: lambda.Function;
  public readonly deleteRecipeFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: RecipeDataStoreProps) {
    super(scope, id);

    // Create DynamoDB table for recipes
    this.recipeTable = new dynamodb.Table(this, 'AlgoSpoonRecipesTable', {
      tableName: 'AlgoSpoonRecipes',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'recipeId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for querying by recipe type
    this.recipeTable.addGlobalSecondaryIndex({
      indexName: 'RecipeTypeIndex',
      partitionKey: {
        name: 'recipeType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Lambda function for saving recipes
    this.saveRecipeFunction = new lambda.Function(this, 'SaveRecipeFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../services/recipes/save-recipe')),
      environment: {
        RECIPE_TABLE_NAME: this.recipeTable.tableName,
        USER_TABLE_NAME: props.userTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for getting recipes
    this.getRecipesFunction = new lambda.Function(this, 'GetRecipesFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../services/recipes/get-recipes')),
      environment: {
        RECIPE_TABLE_NAME: this.recipeTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for deleting recipes
    this.deleteRecipeFunction = new lambda.Function(this, 'DeleteRecipeFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../services/recipes/delete-recipe')),
      environment: {
        RECIPE_TABLE_NAME: this.recipeTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant DynamoDB permissions
    this.recipeTable.grantReadWriteData(this.saveRecipeFunction);
    this.recipeTable.grantReadData(this.getRecipesFunction);
    this.recipeTable.grantReadWriteData(this.deleteRecipeFunction);
    props.userTable.grantReadData(this.saveRecipeFunction);

    // Create API Gateway resources using passed resource
    const recipesResource = props.recipesResource;
    
    // POST /recipes - Save a new recipe
    recipesResource.addMethod('POST', new apigateway.LambdaIntegration(this.saveRecipeFunction), {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
    });

    // GET /recipes/{userId} - Get all recipes for a user
    const userRecipesResource = recipesResource.addResource('{userId}');
    userRecipesResource.addMethod('GET', new apigateway.LambdaIntegration(this.getRecipesFunction), {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // DELETE /recipes/{userId}/{recipeId} - Delete a specific recipe
    const recipeIdResource = userRecipesResource.addResource('{recipeId}');
    recipeIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.deleteRecipeFunction), {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });
  }
}
