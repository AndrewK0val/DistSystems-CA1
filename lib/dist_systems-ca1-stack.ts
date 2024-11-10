import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import * as apig from "aws-cdk-lib/aws-apigateway"
import { patients } from "../seed/patients";

export class DistSystemsCa1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const patientsTable = new dynamodb.Table(this, "PatientsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {name: "id", type: dynamodb.AttributeType.NUMBER},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Patients",

    })



    //FUnctions
    
    const getPatientByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetPatientById",
      {
        architecture: lambda.Architecture.ARM_64,
        reuntime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getPatientById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: patientsTable.tableName,
          REGION: 'eu-west-2',
        },
      }
    );


    const getAllPatientsFn = new lambdanode.NodejsFunction(
      this,
      "GetAllPatientsFn",
      {
        architecture: lambda.Architecture.ARM_64,
        reuntime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getAllPatients.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: patientsTable.tableName,
          REGION: 'eu-west-2',
        },
      }
    );


      const newPatientFn = new lambdanode.NodejsFunction(
        this,
        "AddPatientFn",
        {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/addPatient.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: patientsTable.tableName,
          REGION: "eu-west-2",
        },
      }
      );


      const deletePatientFn = new lambdanode.NodejsFunction(
        this,
        "DeletePatientFn",
        {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/deletePatient.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: patientsTable.tableName,
          REGION: "eu-west-2",
        },
      }
      );


      new custom.AwsCustomResource(this, "patientsddbInitData", {
        onCreate: {
          service: "DynamoDB",
          action: "batchWriteItem",
          parameters: {
            RequestItems: {
              [patientsTable.tableName]: generateBatch(patients),
              
            }, 
          },
          physicalResourceId: custom.PhysicalResourceId.of("patientsddbInitData"),
        },
        policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [patientsTable.tableArn]
        }),
      })


      //Perms

      patientsTable.grantReadData(getPatientByIdFn)
      patientsTable.grantReadData(getAllPatientsFn)
      patientsTable.grantReadWriteData(newPatientFn)
      patientsTable.grantReadWriteData(deletePatientFn)

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'DistSystemsCa1Queue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

       // REST API 
      const api = new apig.RestApi(this, "RestAPI", {
        description: "CA1 api",
        deployOptions: {
          stageName: "dev",
        },
        defaultCorsPreflightOptions: {
          allowHeaders: ["Content-Type", "X-Amz-Date"],
          allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
          allowCredentials: true,
          allowOrigins: ["*"],
        },
      });

      const patientsEndpoint = api.root.addResource("patients");
      patientsEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getAllPatientsFn, { proxy: true })
      );

      const patientEndpoint = patientsEndpoint.addResource("{patientId}");
      patientEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getPatientByIdFn, { proxy: true })
      );

      patientsEndpoint.addMethod(
        "POST",
        new apig.LambdaIntegration(newPatientFn, {proxy: true })
      );
      
      patientEndpoint.addMethod(
        "DELETE",
        new apig.LambdaIntegration(deletePatientFn, {proxy: true})
      );

  }
}
