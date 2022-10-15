import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creating Dynamo DB Table
    const productTable = new Table(this, "product", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: "product",
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Creating Lambda
    const productFunction = new NodejsFunction(this, "productFunction", {
      entry: join(__dirname, "/../src/product/index.js"),
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "id",
        DYNAMO_TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    });

    productTable.grantReadWriteData(productFunction);

    // Creating API GateWay

    const apiGtw = new LambdaRestApi(this, "productAPI", {
      restApiName: "Product Service",
      handler: productFunction,
      proxy: false,
    });

    {
      /*
    1. GET ==> /product
    2. POST ==> /product
    3. GET ==> /product/{id}
    4. PUT ==> /product/{id}
    5. DELETE ==> /product/{id}
  */
    }

    const product = apiGtw.root.addResource("product");
    product.addMethod("GET"); // Requirement 1
    product.addMethod("POST"); // Requirement 2

    const singleProduct = product.addResource("{id}");
    singleProduct.addMethod("GET"); // Requirement 3
    singleProduct.addMethod("PUT"); // Requirement 4
    singleProduct.addMethod("DELETE"); // Requirement 5
  }
}
