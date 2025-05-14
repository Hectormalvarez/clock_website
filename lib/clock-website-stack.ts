import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class ClockWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the S3 bucket for static website hosting
    const websiteBucket = new s3.Bucket(this, 'ClockWebsiteBucket', {
      bucketName: `simple-clock-website-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`, // Unique bucket name
      websiteIndexDocument: 'index.html',
      publicReadAccess: true, // WARNING: This makes the bucket content publicly readable
      blockPublicAccess: new s3.BlockPublicAccess({ // Attempting to disable block public access in v1
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // WARNING: This will delete the bucket and its contents when the stack is destroyed
      autoDeleteObjects: true, // WARNING: This will delete all objects in the bucket when the stack is destroyed
    });

    // Deploy the Vite build output to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./dist')], // Point to Vite's output directory
      destinationBucket: websiteBucket,
      // Optional: Invalidate CloudFront cache if using CloudFront
      // distribution: yourCloudFrontDistribution,
      // distributionPaths: ['/*'],
    });
  }
}
