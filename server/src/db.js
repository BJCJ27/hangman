// DynamoDB connection. In Docker this points at the DynamoDB Local container;
// the AWS SDK still needs a region and keys, so local dummy values are used.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const TABLE_NAME = process.env.TABLE_NAME || 'Players';
// Secondary index so we can QUERY players by name instead of SCANNING the table.
export const NAME_INDEX = 'PlayerNameIndex';

export const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
});

// The Document Client lets us use plain JS objects ({ wins: 3 }) instead of
// DynamoDB's typed format ({ wins: { N: "3" } }).
export const docClient = DynamoDBDocumentClient.from(client);
