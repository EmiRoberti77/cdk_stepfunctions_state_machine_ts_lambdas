#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkStepfunctionsSampleStack } from "../lib/cdk_stepfunctions_sample-stack";

const app = new cdk.App();
new CdkStepfunctionsSampleStack(app, "CdkStepfunctionsSampleStack", {});
