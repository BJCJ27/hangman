// Creates the Players table if it doesn't exist yet.
// Runs automatically when the server starts, or by hand: npm run create-table
import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import { client, TABLE_NAME, NAME_INDEX } from './db.js';
import { pathToFileURL } from 'node:url';

export const tableDefinition = {
  TableName: TABLE_NAME,
  // playerID is the primary (partition) key, so two players named "Mike"
  // never overwrite each other.
  KeySchema: [{ AttributeName: 'playerID', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'playerID', AttributeType: 'S' },
    { AttributeName: 'playerNameLower', AttributeType: 'S' },
  ],
  // Global secondary index on the lowercase name: lets GET /players?playerName=
  // use a Query (reads only matching items) instead of a Scan (reads every item).
  GlobalSecondaryIndexes: [
    {
      IndexName: NAME_INDEX,
      KeySchema: [{ AttributeName: 'playerNameLower', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// DynamoDB Local can take a few seconds to boot in Docker, so retry.
export async function ensureTable({ retries = 15, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      console.log(`Table "${TABLE_NAME}" is ready`);
      return;
    } catch (err) {
      if (err instanceof ResourceNotFoundException || err.name === 'ResourceNotFoundException') {
        await client.send(new CreateTableCommand(tableDefinition));
        console.log(`Created table "${TABLE_NAME}"`);
        return;
      }
      console.log(`Waiting for DynamoDB (attempt ${attempt}/${retries}): ${err.message}`);
      await sleep(delayMs);
    }
  }
  throw new Error('Could not reach DynamoDB');
}

// Allow running this file directly: node src/createTable.js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  ensureTable().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
