# AWS Step Functions with Lambda: Purchase and Refund Operations

## Overview

This repository demonstrates how to orchestrate purchase and refund operations using AWS Step Functions and AWS Lambda. By leveraging the capabilities of AWS Step Functions, we ensure a clean, scalable, and maintainable workflow for processing different types of operations.

## Features

- Step Functions State Machine:

  - Orchestrates the flow of operations using choice states.
  - Routes requests to the appropriate Lambda function based on the operation field (purchase or refund).

- AWS Lambda Functions:

  - Handles purchase and refund operations independently.

- Scalable Architecture:

  - Supports adding new operations and steps without modifying existing functionality.

- Error Handling:

  - Built-in error handling and retry mechanisms in Step Functions.

- Architecture

## State Machine Workflow

- Input:

  - The state machine receives a JSON payload with an operation field (e.g., purchase or refund).

- Choice State:

  - Routes the request to the appropriate Lambda function based on the value of operation.

- Task State:

  - Invokes the respective Lambda function (PurchaseLambda or RefundLambda).

- End States:
  - Succeed or fail based on the execution outcome.

## Example JSON Input

For purchase:

```json
{
  "operation": "purchase",
  "data": {
    "itemId": "12345",
    "quantity": 2,
    "userId": "user-001",
    "timestamp": "2025-01-12T10:30:00Z"
  }
}
```

For Refund:

```json
{
  "operation": "refund",
  "data": {
    "itemId": "12345",
    "quantity": 1,
    "userId": "user-001",
    "timestamp": "2025-01-12T11:00:00Z"
  }
}
```

## Create Lambda Functions:

Write and deploy the following Lambda functions:

## Purchase Lambda:

```typescript
export const handler = async (event: any) => {
  console.log("Purchase lambda");
  return {
    status: "success",
    message: "Purchase processes",
    event,
  };
};
```

## Refund Lambda:

```typescript
export const handler = async (event: any) => {
  console.log("Refund lambda");
  return {
    status: "success",
    message: "Refund processes",
    event,
  };
};
```

## Deploy Step Functions:

Create a state machine using the following JSON definition:

```json
{
  "Comment": "State machine for purchase and refund operations",
  "StartAt": "Check Operation",
  "States": {
    "Check Operation": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.operation",
          "StringEquals": "purchase",
          "Next": "Purchase Lambda"
        },
        {
          "Variable": "$.operation",
          "StringEquals": "refund",
          "Next": "Refund Lambda"
        }
      ],
      "Default": "Invalid Operation"
    },
    "Purchase Lambda": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:<region>:<account-id>:function:PurchaseLambda",
      "Next": "Success"
    },
    "Refund Lambda": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:<region>:<account-id>:function:RefundLambda",
      "Next": "Success"
    },
    "Invalid Operation": {
      "Type": "Fail",
      "Error": "InvalidOperationError",
      "Cause": "The operation provided is not valid."
    },
    "Success": {
      "Type": "Succeed"
    }
  }
}
```

## CDK

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
