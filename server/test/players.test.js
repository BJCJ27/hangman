// Database-layer tests: the AWS SDK is mocked (aws-sdk-client-mock), so we can
// check exactly which DynamoDB commands are sent without a running database.
import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { findPlayerByName, createPlayer, updatePlayerStats } from '../src/players.js';
import { TABLE_NAME, NAME_INDEX } from '../src/db.js';

const ddb = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddb.reset());

describe('findPlayerByName', () => {
  it('uses a Query on the name index, not a Scan', async () => {
    ddb.on(QueryCommand).resolves({ Items: [{ playerID: 'id-1', playerName: 'Brock' }] });

    const player = await findPlayerByName('  Brock ');

    expect(player).toEqual({ playerID: 'id-1', playerName: 'Brock' });
    expect(ddb.commandCalls(ScanCommand)).toHaveLength(0);
    const input = ddb.commandCalls(QueryCommand)[0].args[0].input;
    expect(input.TableName).toBe(TABLE_NAME);
    expect(input.IndexName).toBe(NAME_INDEX);
    expect(input.ExpressionAttributeValues[':name']).toBe('brock');
  });

  it('returns null when no player matches', async () => {
    ddb.on(QueryCommand).resolves({ Items: [] });
    expect(await findPlayerByName('Nobody')).toBeNull();
  });
});

describe('createPlayer', () => {
  it('puts a new player with a unique playerID and 0/0 stats', async () => {
    ddb.on(PutCommand).resolves({});

    const a = await createPlayer('Mike');
    const b = await createPlayer('Mike');

    expect(a).toMatchObject({ playerName: 'Mike', playerNameLower: 'mike', wins: 0, losses: 0 });
    expect(a.playerID).not.toBe(b.playerID); // two "Mike"s never collide
    const input = ddb.commandCalls(PutCommand)[0].args[0].input;
    expect(input.Item.playerID).toBe(a.playerID);
    expect(input.ConditionExpression).toBe('attribute_not_exists(playerID)');
  });
});

describe('updatePlayerStats', () => {
  it('updates wins and losses by playerID', async () => {
    ddb.on(UpdateCommand).resolves({ Attributes: { playerID: 'id-1', wins: 4, losses: 1 } });

    const updated = await updatePlayerStats('id-1', { wins: 4, losses: 1 });

    expect(updated).toEqual({ playerID: 'id-1', wins: 4, losses: 1 });
    const input = ddb.commandCalls(UpdateCommand)[0].args[0].input;
    expect(input.Key).toEqual({ playerID: 'id-1' });
    expect(input.ExpressionAttributeValues[':wins']).toBe(4);
    expect(input.ExpressionAttributeValues[':losses']).toBe(1);
  });

  it('returns null when the player does not exist', async () => {
    const err = new Error('The conditional request failed');
    err.name = 'ConditionalCheckFailedException';
    ddb.on(UpdateCommand).rejects(err);

    expect(await updatePlayerStats('missing', { wins: 1, losses: 0 })).toBeNull();
  });

  it('passes other database errors up', async () => {
    ddb.on(UpdateCommand).rejects(new Error('Network down'));
    await expect(updatePlayerStats('id-1', { wins: 1, losses: 0 })).rejects.toThrow('Network down');
  });
});
