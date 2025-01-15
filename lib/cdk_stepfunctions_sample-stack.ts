import * as cdk from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import { AwsIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { CfnStateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { existsSync } from "fs";
import path = require("path");
import * as fs from "fs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStepfunctionsSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stateMachineDefinitionPath = path.join(
      __dirname,
      "..",
      "state_machine",
      "stateMachine.json"
    );

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
      console.error("error: not found", purchaseLambdaPath);
      return;
    }

    if (!existsSync(refundLambdaPath)) {
      console.error("error: not found", refundLambdaPath);
      return;
    }

    if (!existsSync(stateMachineDefinitionPath)) {
      console.error("error: not found", stateMachineDefinitionPath);
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

    const stateMachineRole = new Role(this, "StateMachineRole", {
      assumedBy: new ServicePrincipal("states.amazonaws.com"),
      managedPolicies: [
        {
          managedPolicyArn:
            "arn:aws:iam::aws:policy/service-role/AWSLambdaRole",
        },
      ],
    });

    // Grant Step Functions permissions to invoke Lambda functions
    stateMachineRole.addToPolicy(
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [purchaseLambda.functionArn, refundLamba.functionArn],
      })
    );

    //load and modify state machine
    const stateMachineDefinition = JSON.parse(
      fs.readFileSync(stateMachineDefinitionPath, "utf-8")
    );

    stateMachineDefinition.States["Purchase Lambda"].Resource =
      purchaseLambda.functionArn;
    stateMachineDefinition.States["Refund Lambda"].Resource =
      refundLamba.functionArn;

    //create a state machine
    const stateMachine = new CfnStateMachine(
      this,
      "emiCDK_OrdersStateMachine",
      {
        definitionString: JSON.stringify(stateMachineDefinition),
        stateMachineName: "emiCDK_OrdersStateMachine",
        roleArn: stateMachineRole.roleArn,
      }
    );

    // Create an API Gateway REST API
    const api = new RestApi(this, "StepFunctionsApi", {
      restApiName: "StepFunctionsIntegration",
    });

    // Create an integration with the existing Step Functions state machine
    const stateMachineIntegration = new AwsIntegration({
      service: "states",
      action: "StartExecution",
      integrationHttpMethod: "POST",
      options: {
        credentialsRole: new Role(this, "ApiGatewayRole", {
          assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
          inlinePolicies: {
            AllowStartExecution: new PolicyDocument({
              statements: [
                new PolicyStatement({
                  actions: ["states:StartExecution"],
                  resources: [stateMachine.attrArn],
                  effect: Effect.ALLOW,
                }),
              ],
            }),
          },
        }),
        requestTemplates: {
          "application/json": JSON.stringify({
            stateMachineArn: stateMachine.attrArn,
            input: "$util.escapeJavaScript($input.body)",
          }),
        },
        integrationResponses: [
          {
            statusCode: "200",
          },
        ],
      },
    });

    // Create a POST method on the API and integrate it with the state machine
    const resource = api.root.addResource("start-execution");
    resource.addMethod("POST", stateMachineIntegration, {
      methodResponses: [
        {
          statusCode: "200",
        },
      ],
    });
  }
}
