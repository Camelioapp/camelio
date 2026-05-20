const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoRegion =
  process.env.DYNAMODB_REGION || process.env.AWS_REGION || "us-east-2";

const client = new DynamoDBClient({
  region: dynamoRegion,
});

const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

module.exports = {
  dynamo,
};