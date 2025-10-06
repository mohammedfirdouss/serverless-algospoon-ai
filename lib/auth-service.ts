import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface AuthServiceProps {
  api: apigateway.RestApi;
}

export class AuthService extends Construct {
  public readonly userTable: dynamodb.Table;
  public readonly registerFunction: lambda.Function;
  public readonly updateProfileFunction: lambda.Function;
  public readonly getUserFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: AuthServiceProps) {
    super(scope, id);

    // Create DynamoDB table for users with enhanced profile attributes
    this.userTable = new dynamodb.Table(this, 'AlgoSpoonUsersTable', {
      tableName: 'AlgoSpoonUsers',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for email lookup
    this.userTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Lambda function for user registration
    this.registerFunction = new lambda.Function(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../services/auth/register')),
      environment: {
        USER_TABLE_NAME: this.userTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for updating user profile
    this.updateProfileFunction = new lambda.Function(this, 'UpdateProfileFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../services/auth/update-profile')),
      environment: {
        USER_TABLE_NAME: this.userTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for getting user profile
    this.getUserFunction = new lambda.Function(this, 'GetUserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../services/auth/get-user')),
      environment: {
        USER_TABLE_NAME: this.userTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant DynamoDB permissions
    this.userTable.grantReadWriteData(this.registerFunction);
    this.userTable.grantReadWriteData(this.updateProfileFunction);
    this.userTable.grantReadData(this.getUserFunction);

    // Create API Gateway resources
    const authResource = props.api.root.addResource('auth');
    
    // POST /auth/register
    const registerResource = authResource.addResource('register');
    registerResource.addMethod('POST', new apigateway.LambdaIntegration(this.registerFunction), {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
    });

    // PUT /auth/profile
    const profileResource = authResource.addResource('profile');
    profileResource.addMethod('PUT', new apigateway.LambdaIntegration(this.updateProfileFunction), {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // GET /auth/profile/{userId}
    const userIdResource = profileResource.addResource('{userId}');
    userIdResource.addMethod('GET', new apigateway.LambdaIntegration(this.getUserFunction), {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });
  }
}
