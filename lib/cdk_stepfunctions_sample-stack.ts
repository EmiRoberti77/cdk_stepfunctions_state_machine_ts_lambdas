import * as cdk from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { existsSync } from "fs";
import path = require("path");
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStepfunctionsSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const purchaseLambdaPath = path.join(
      __dirname,
      "..",
      "src",
      "lambdas",
      "LambdaPurchase",
      "handler.ts"
    );

    const refundLambdaPath = path.join(
      __dirname,
      "..",
      "src",
      "lambdas",
      "LambdaRefund",
      "handler.ts"
    );

    if (!existsSync(purchaseLambdaPath)) {
      console.log("error: not found", purchaseLambdaPath);
      return;
    }

    if (!existsSync(refundLambdaPath)) {
      console.log("error: not found", refundLambdaPath);
      return;
    }

    const refundLamba = new NodejsFunction(this, "emi-cdk-test-refund-lambda", {
      runtime: Runtime.NODEJS_20_X,
      entry: refundLambdaPath,
      handler: "handler",
      functionName: "emi-cdk-test-refund-lambda",
    });

    const purchaseLambda = new NodejsFunction(
      this,
      "emi-cdk-test-purchase-lambda",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: purchaseLambdaPath,
        handler: "handler",
        functionName: "emi-cdk-test-purchase-lambda",
      }
    );

    purchaseLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["*"],
      })
    );

    refundLamba.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["*"],
      })
    );

    new CfnOutput(this, "refundLambda", {
      value: refundLamba.functionArn,
    });

    new CfnOutput(this, "purchaseLambda", {
      value: purchaseLambda.functionArn,
    });
  }
}
