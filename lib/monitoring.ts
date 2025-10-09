import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface MonitoringProps {
  api: apigateway.RestApi;
  lambdaFunctions: lambda.Function[];
  dynamoTables: dynamodb.Table[];
  alarmEmail?: string;
}

export class Monitoring extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: 'AlgoSpoon Alarms',
      topicName: 'AlgoSpoonAlarms',
    });

    // Subscribe email if provided
    if (props.alarmEmail) {
      this.alarmTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(props.alarmEmail)
      );
    }

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'AlgoSpoonDashboard', {
      dashboardName: 'AlgoSpoon-Metrics',
    });

    // Add API Gateway metrics
    this.addApiGatewayAlarms(props.api);
    
    // Add Lambda function alarms
    props.lambdaFunctions.forEach((fn) => {
      this.addLambdaAlarms(fn);
    });

    // Add DynamoDB alarms
    props.dynamoTables.forEach((table) => {
      this.addDynamoDBAlarms(table);
    });

    // Create dashboard widgets
    this.createDashboardWidgets(props);
  }

  private addApiGatewayAlarms(api: apigateway.RestApi): void {
    // Alarm for high 5XX error rate
    const serverErrorAlarm = new cloudwatch.Alarm(this, 'ApiServerErrorAlarm', {
      alarmName: 'AlgoSpoon-API-5XX-Errors',
      metric: api.metricServerError({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway 5XX errors exceeded threshold',
    });
    serverErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Alarm for high 4XX error rate
    const clientErrorAlarm = new cloudwatch.Alarm(this, 'ApiClientErrorAlarm', {
      alarmName: 'AlgoSpoon-API-4XX-Errors',
      metric: api.metricClientError({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway 4XX errors exceeded threshold',
    });
    clientErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Alarm for high latency
    const latencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: 'AlgoSpoon-API-High-Latency',
      metric: api.metricLatency({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3000, // 3 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway latency exceeded 3 seconds',
    });
    latencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
  }

  private addLambdaAlarms(fn: lambda.Function): void {
    const functionName = fn.functionName;

    // Alarm for Lambda errors
    const errorAlarm = new cloudwatch.Alarm(this, `${functionName}ErrorAlarm`, {
      alarmName: `AlgoSpoon-Lambda-${functionName}-Errors`,
      metric: fn.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda ${functionName} errors exceeded threshold`,
    });
    errorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Alarm for Lambda throttles
    const throttleAlarm = new cloudwatch.Alarm(this, `${functionName}ThrottleAlarm`, {
      alarmName: `AlgoSpoon-Lambda-${functionName}-Throttles`,
      metric: fn.metricThrottles({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda ${functionName} throttles detected`,
    });
    throttleAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Alarm for Lambda duration (approaching timeout)
    const durationAlarm = new cloudwatch.Alarm(this, `${functionName}DurationAlarm`, {
      alarmName: `AlgoSpoon-Lambda-${functionName}-Duration`,
      metric: fn.metricDuration({
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: fn.timeout ? fn.timeout.toMilliseconds() * 0.9 : 27000, // 90% of timeout
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda ${functionName} duration approaching timeout`,
    });
    durationAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
  }

  private addDynamoDBAlarms(table: dynamodb.Table): void {
    const tableName = table.tableName;

    // Alarm for read throttles
    const readThrottleAlarm = new cloudwatch.Alarm(this, `${tableName}ReadThrottleAlarm`, {
      alarmName: `AlgoSpoon-DynamoDB-${tableName}-ReadThrottles`,
      metric: table.metricUserErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `DynamoDB ${tableName} user errors detected`,
    });
    readThrottleAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Alarm for system errors
    const systemErrorAlarm = new cloudwatch.Alarm(this, `${tableName}SystemErrorAlarm`, {
      alarmName: `AlgoSpoon-DynamoDB-${tableName}-SystemErrors`,
      metric: table.metricSystemErrorsForOperations({
        operations: [dynamodb.Operation.GET_ITEM, dynamodb.Operation.PUT_ITEM, dynamodb.Operation.QUERY],
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `DynamoDB ${tableName} system errors detected`,
    });
    systemErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
  }

  private createDashboardWidgets(props: MonitoringProps): void {
    // API Gateway metrics
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          props.api.metricCount({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Total Requests',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Errors',
        left: [
          props.api.metricServerError({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: '5XX Errors',
            color: cloudwatch.Color.RED,
          }),
          props.api.metricClientError({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: '4XX Errors',
            color: cloudwatch.Color.ORANGE,
          }),
        ],
        width: 12,
      })
    );

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [
          props.api.metricLatency({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            label: 'Average Latency',
          }),
          props.api.metricLatency({
            statistic: 'p99',
            period: cdk.Duration.minutes(5),
            label: 'P99 Latency',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'API Requests (Last Hour)',
        metrics: [
          props.api.metricCount({
            statistic: 'Sum',
            period: cdk.Duration.hours(1),
          }),
        ],
        width: 12,
      })
    );

    // Lambda metrics
    const lambdaWidgets: cloudwatch.IWidget[] = [];
    props.lambdaFunctions.forEach((fn, index) => {
      if (index % 2 === 0 && index > 0) {
        this.dashboard.addWidgets(...lambdaWidgets);
        lambdaWidgets.length = 0;
      }

      lambdaWidgets.push(
        new cloudwatch.GraphWidget({
          title: `Lambda: ${fn.functionName}`,
          left: [
            fn.metricInvocations({
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
              label: 'Invocations',
            }),
            fn.metricErrors({
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
              label: 'Errors',
              color: cloudwatch.Color.RED,
            }),
          ],
          right: [
            fn.metricDuration({
              statistic: 'Average',
              period: cdk.Duration.minutes(5),
              label: 'Duration (ms)',
            }),
          ],
          width: 12,
        })
      );
    });
    
    if (lambdaWidgets.length > 0) {
      this.dashboard.addWidgets(...lambdaWidgets);
    }

    // DynamoDB metrics
    const dynamoWidgets: cloudwatch.IWidget[] = [];
    props.dynamoTables.forEach((table, index) => {
      if (index % 2 === 0 && index > 0) {
        this.dashboard.addWidgets(...dynamoWidgets);
        dynamoWidgets.length = 0;
      }

      dynamoWidgets.push(
        new cloudwatch.GraphWidget({
          title: `DynamoDB: ${table.tableName}`,
          left: [
            table.metricConsumedReadCapacityUnits({
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
              label: 'Read Capacity',
            }),
            table.metricConsumedWriteCapacityUnits({
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
              label: 'Write Capacity',
            }),
          ],
          right: [
            table.metricUserErrors({
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
              label: 'User Errors',
              color: cloudwatch.Color.RED,
            }),
          ],
          width: 12,
        })
      );
    });

    if (dynamoWidgets.length > 0) {
      this.dashboard.addWidgets(...dynamoWidgets);
    }
  }
}
