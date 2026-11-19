// All DynamoDB reads/writes for players live here, so the routes in app.js
// stay short and the database can be swapped out in tests.
import { randomUUID } from 'node:crypto';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, NAME_INDEX } from './db.js';

// Names are matched case-insensitively: "Brock" and "brock" are the same player.
export const normalizeName = (name) => name.trim().toLowerCase();

// GET: find a player by name with a Query on the name index (not a Scan).
export async function findPlayerByName(playerName) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: NAME_INDEX,
      KeyConditionExpression: 'playerNameLower = :name',
      ExpressionAttributeValues: { ':name': normalizeName(playerName) },
      Limit: 1,
    }),
  );
  return result.Items?.[0] ?? null;
}

// POST: create a new player with 0 wins / 0 losses.
export async function createPlayer(playerName) {
  const player = {
    playerID: randomUUID(),
    playerName: playerName.trim(),
    playerNameLower: normalizeName(playerName),
    wins: 0,
    losses: 0,
    createdAt: new Date().toISOString(),
  };
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: player,
      // Never overwrite an existing player if a UUID ever repeats.
      ConditionExpression: 'attribute_not_exists(playerID)',
    }),
  );
  return player;
}

// PUT: save a player's wins and losses. Returns null if the player doesn't exist.
export async function updatePlayerStats(playerID, { wins, losses }) {
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { playerID },
        UpdateExpression: 'SET wins = :wins, losses = :losses, updatedAt = :now',
        // Only update players that already exist (otherwise Update would create one).
        ConditionExpression: 'attribute_exists(playerID)',
        ExpressionAttributeValues: {
          ':wins': wins,
          ':losses': losses,
          ':now': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return null;
    throw err;
  }
}

export default { findPlayerByName, createPlayer, updatePlayerStats };
