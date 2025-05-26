import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { getConfig } from '../config';

export class ClockWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get configuration based on environment
    const config = getConfig(process.env.NODE_ENV);
    
    // Replace hardcoded values with config values
    const domainName = config.aws.domainName;
    const baseDomainName = config.aws.baseDomainName;
    const hostedZoneId = config.aws.hostedZoneId;

    // Define the S3 bucket for static website hosting
    const websiteBucket = new s3.Bucket(this, 'ClockWebsiteBucket', {
      bucketName: `simple-clock-website-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`, // Unique bucket name
      websiteIndexDocument: 'index.html',
      // Removed publicReadAccess: true
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block all public access
      removalPolicy: cdk.RemovalPolicy.DESTROY, // WARNING: This will delete the bucket and its contents when the stack is destroyed
      autoDeleteObjects: true, // WARNING: This will delete all objects in the bucket when the stack is destroyed
    });

    // Create an Origin Access Control (OAC) for CloudFront to access the S3 bucket
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'OriginAccessControl', {
      originAccessControlName: 'ClockWebsiteBucketOAC',
      signing: cloudfront.Signing.SIGV4_ALWAYS,
      description: 'OAC for Clock Website S3 Bucket',
    });

    // Create an ACM certificate in us-east-1 for CloudFront
    // NOTE: ACM certificates used with CloudFront must be in the us-east-1 region.
    // For production applications, it is recommended to create this certificate
    // in a separate stack deployed specifically to us-east-1.
    const certificate = new acm.Certificate(this, 'WebsiteCertificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: hostedZoneId,
        zoneName: baseDomainName,
      })),
    });

    // Create a CloudFront distribution with S3 origin using Origin Access Control
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [domainName], // Associate the domain name
      certificate: certificate, // Associate the ACM certificate
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
          originAccessControl: originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
    });

    // Grant CloudFront permission to access the S3 bucket
    websiteBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [websiteBucket.arnForObjects('*')],
        principals: [new cdk.aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${distribution.distributionId}`
          }
        }
      })
    );


    // Look up the Hosted Zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZoneLookup', {
      hostedZoneId: hostedZoneId,
      zoneName: baseDomainName,
    });

    // Create an A alias record in Route 53 pointing to the CloudFront distribution
    new route53.ARecord(this, 'WebsiteAliasRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
      recordName: domainName.split('.')[0], // Use the subdomain part only (e.g., "clock")
    });

    // Deploy the Vite build output to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./dist')], // Point to Vite's output directory
      destinationBucket: websiteBucket,
      distribution: distribution, // Invalidate CloudFront cache
      distributionPaths: ['/*'], // Invalidate all paths
    });

    // Output the CloudFront distribution domain name
    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });
  }
}
