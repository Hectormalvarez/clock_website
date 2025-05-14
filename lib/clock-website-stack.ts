import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class ClockWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the S3 bucket for static website hosting
    new s3.Bucket(this, 'ClockWebsiteBucket', {
      bucketName: `simple-clock-website-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`, // Unique bucket name
      websiteIndexDocument: 'index.html',
      publicReadAccess: true, // WARNING: This makes the bucket content publicly readable
      removalPolicy: cdk.RemovalPolicy.DESTROY, // WARNING: This will delete the bucket and its contents when the stack is destroyed
      autoDeleteObjects: true, // WARNING: This will delete all objects in the bucket when the stack is destroyed
    });
  }
}
