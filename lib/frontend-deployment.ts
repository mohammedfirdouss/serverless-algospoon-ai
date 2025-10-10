import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export interface FrontendDeploymentProps {
  /**
   * Path to the frontend build directory
   * @default './frontend/dist'
   */
  buildPath?: string;
  
  /**
   * Custom domain name (optional)
   */
  domainName?: string;
  
  /**
   * ACM certificate ARN for custom domain (optional)
   */
  certificateArn?: string;
}

export class FrontendDeployment extends Construct {
  public readonly websiteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props?: FrontendDeploymentProps) {
    super(scope, id);

    // Create S3 bucket for website hosting
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `algospoon-frontend-${cdk.Stack.of(this).account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for AlgoSpoon Frontend',
    });

    // Grant CloudFront read access to S3
    this.websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [originAccessIdentity.grantPrincipal],
        actions: ['s3:GetObject'],
        resources: [this.websiteBucket.arnForObjects('*')],
      })
    );

    // Create CloudFront distribution
    const distributionConfig: cloudfront.DistributionProps = {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(this.websiteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
      enableLogging: true,
      comment: 'AlgoSpoon AI Frontend Distribution',
      ...(props?.domainName && props?.certificateArn ? {
        domainNames: [props.domainName],
        certificate: acm.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.certificateArn
        ),
      } : {}),
    };

    this.distribution = new cloudfront.Distribution(this, 'Distribution', distributionConfig);

    this.distributionDomainName = this.distribution.distributionDomainName;

    // Deploy website files to S3 (if build path exists)
    const buildPath = props?.buildPath || './frontend/dist';
    
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(buildPath)],
      destinationBucket: this.websiteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      prune: true, // Remove old files
      retainOnDelete: false,
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: 'AlgoSpoonWebsiteURL',
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'WebsiteBucket', {
      value: this.websiteBucket.bucketName,
      description: 'S3 Website Bucket',
      exportName: 'AlgoSpoonWebsiteBucket',
    });
  }
}
