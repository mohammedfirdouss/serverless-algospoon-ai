import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export interface WafProps {
  /**
   * The API Gateway REST API to protect
   */
  api: apigateway.RestApi;
  
  /**
   * Rate limit per 5 minutes per IP
   * @default 2000
   */
  rateLimit?: number;
  
  /**
   * Enable AWS managed rule sets
   * @default true
   */
  enableManagedRules?: boolean;
}

export class Waf extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WafProps) {
    super(scope, id);

    const rateLimit = props.rateLimit || 2000;
    const enableManagedRules = props.enableManagedRules !== false;

    // Create WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'AlgoSpoonWAF',
        sampledRequestsEnabled: true,
      },
      name: 'AlgoSpoonAPIProtection',
      description: 'WAF rules for AlgoSpoon API Gateway',
      rules: [
        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 1,
          action: {
            block: {
              customResponse: {
                responseCode: 429,
              },
            },
          },
          statement: {
            rateBasedStatement: {
              limit: rateLimit,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
        // AWS Managed Rules - Core Rule Set
        ...(enableManagedRules
          ? [
              {
                name: 'AWSManagedRulesCommonRuleSet',
                priority: 2,
                overrideAction: { none: {} },
                statement: {
                  managedRuleGroupStatement: {
                    vendorName: 'AWS',
                    name: 'AWSManagedRulesCommonRuleSet',
                    excludedRules: [],
                  },
                },
                visibilityConfig: {
                  cloudWatchMetricsEnabled: true,
                  metricName: 'AWSManagedRulesCommonRuleSet',
                  sampledRequestsEnabled: true,
                },
              },
              // AWS Managed Rules - Known Bad Inputs
              {
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
                priority: 3,
                overrideAction: { none: {} },
                statement: {
                  managedRuleGroupStatement: {
                    vendorName: 'AWS',
                    name: 'AWSManagedRulesKnownBadInputsRuleSet',
                    excludedRules: [],
                  },
                },
                visibilityConfig: {
                  cloudWatchMetricsEnabled: true,
                  metricName: 'AWSManagedRulesKnownBadInputsRuleSet',
                  sampledRequestsEnabled: true,
                },
              },
              // AWS Managed Rules - SQL Injection
              {
                name: 'AWSManagedRulesSQLiRuleSet',
                priority: 4,
                overrideAction: { none: {} },
                statement: {
                  managedRuleGroupStatement: {
                    vendorName: 'AWS',
                    name: 'AWSManagedRulesSQLiRuleSet',
                    excludedRules: [],
                  },
                },
                visibilityConfig: {
                  cloudWatchMetricsEnabled: true,
                  metricName: 'AWSManagedRulesSQLiRuleSet',
                  sampledRequestsEnabled: true,
                },
              },
              // AWS Managed Rules - Amazon IP Reputation List
              {
                name: 'AWSManagedRulesAmazonIpReputationList',
                priority: 5,
                overrideAction: { none: {} },
                statement: {
                  managedRuleGroupStatement: {
                    vendorName: 'AWS',
                    name: 'AWSManagedRulesAmazonIpReputationList',
                    excludedRules: [],
                  },
                },
                visibilityConfig: {
                  cloudWatchMetricsEnabled: true,
                  metricName: 'AWSManagedRulesAmazonIpReputationList',
                  sampledRequestsEnabled: true,
                },
              },
              // Block requests without User-Agent header
              {
                name: 'BlockMissingUserAgent',
                priority: 6,
                action: { block: {} },
                statement: {
                  notStatement: {
                    statement: {
                      sizeConstraintStatement: {
                        fieldToMatch: {
                          singleHeader: {
                            name: 'user-agent',
                          },
                        },
                        comparisonOperator: 'GT',
                        size: 0,
                        textTransformations: [
                          {
                            priority: 0,
                            type: 'NONE',
                          },
                        ],
                      },
                    },
                  },
                },
                visibilityConfig: {
                  cloudWatchMetricsEnabled: true,
                  metricName: 'BlockMissingUserAgent',
                  sampledRequestsEnabled: true,
                },
              },
            ]
          : []),
      ],
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: `arn:aws:apigateway:${cdk.Stack.of(this).region}::/restapis/${props.api.restApiId}/stages/${props.api.deploymentStage.stageName}`,
      webAclArn: this.webAcl.attrArn,
    });

    // Output WAF ARN
    new cdk.CfnOutput(this, 'WebACLArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: 'AlgoSpoonWAFArn',
    });
  }
}
