import * as cdk from 'aws-cdk-lib';

export interface EnvironmentConfig {
  // Environment name
  environment: 'dev' | 'staging' | 'prod';
  
  // DynamoDB settings
  dynamodb: {
    pointInTimeRecovery: boolean;
    removalPolicy: cdk.RemovalPolicy;
  };
  
  // Lambda settings
  lambda: {
    logRetention: number; // days
    reservedConcurrentExecutions?: number;
  };
  
  // Monitoring settings
  monitoring: {
    enableDetailedMetrics: boolean;
    alarmEmail?: string;
  };
  
  // API Gateway settings
  apiGateway: {
    throttle: {
      rateLimit: number;
      burstLimit: number;
    };
    loggingLevel: 'INFO' | 'ERROR' | 'OFF';
  };
  
  // WAF settings
  waf: {
    enabled: boolean;
    rateLimit: number;
  };
  
  // CloudFront settings
  frontend: {
    deployFrontend: boolean;
    customDomain?: {
      domainName: string;
      certificateArn: string;
    };
  };
  
  // Bedrock settings
  bedrock: {
    modelId: string;
    defaultTemperature: number;
    maxTokens: number;
  };
}

export const getConfig = (environment: string): EnvironmentConfig => {
  const configs: Record<string, EnvironmentConfig> = {
    dev: {
      environment: 'dev',
      dynamodb: {
        pointInTimeRecovery: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
      lambda: {
        logRetention: 7, // 1 week
      },
      monitoring: {
        enableDetailedMetrics: false,
        // alarmEmail: 'dev-team@example.com',
      },
      apiGateway: {
        throttle: {
          rateLimit: 100,
          burstLimit: 200,
        },
        loggingLevel: 'INFO',
      },
      waf: {
        enabled: false,
        rateLimit: 1000,
      },
      frontend: {
        deployFrontend: false, // Deploy manually in dev
      },
      bedrock: {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0', // Cheaper model for dev
        defaultTemperature: 0.7,
        maxTokens: 4096,
      },
    },
    staging: {
      environment: 'staging',
      dynamodb: {
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
      lambda: {
        logRetention: 14, // 2 weeks
      },
      monitoring: {
        enableDetailedMetrics: true,
        // alarmEmail: 'staging-team@example.com',
      },
      apiGateway: {
        throttle: {
          rateLimit: 500,
          burstLimit: 1000,
        },
        loggingLevel: 'INFO',
      },
      waf: {
        enabled: true,
        rateLimit: 2000,
      },
      frontend: {
        deployFrontend: true,
      },
      bedrock: {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        defaultTemperature: 0.7,
        maxTokens: 4096,
      },
    },
    prod: {
      environment: 'prod',
      dynamodb: {
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
      lambda: {
        logRetention: 30, // 1 month
        reservedConcurrentExecutions: 10, // Reserve capacity
      },
      monitoring: {
        enableDetailedMetrics: true,
        alarmEmail: 'alerts@algospoon.com',
      },
      apiGateway: {
        throttle: {
          rateLimit: 1000,
          burstLimit: 2000,
        },
        loggingLevel: 'ERROR',
      },
      waf: {
        enabled: true,
        rateLimit: 5000,
      },
      frontend: {
        deployFrontend: true,
        // customDomain: {
        //   domainName: 'app.algospoon.com',
        //   certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/xxxxx',
        // },
      },
      bedrock: {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        defaultTemperature: 0.7,
        maxTokens: 8192,
      },
    },
  };

  const config = configs[environment];
  if (!config) {
    throw new Error(
      `Invalid environment: ${environment}. Must be one of: ${Object.keys(configs).join(', ')}`
    );
  }

  return config;
};

export const getStackName = (baseName: string, environment: string): string => {
  return `${baseName}-${environment}`;
};

export const getResourceName = (baseName: string, environment: string): string => {
  return `${baseName}-${environment}`;
};
