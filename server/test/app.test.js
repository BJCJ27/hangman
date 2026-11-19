// Route tests: send real HTTP requests to the Express app (supertest), with a
// fake in-memory "database" passed in instead of DynamoDB.
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

function fakePlayers() {
  const rows = new Map();
  let nextId = 1;
  return {
    rows,
    async findPlayerByName(name) {
      const key = name.trim().toLowerCase();
      return [...rows.values()].find((p) => p.playerNameLower === key) ?? null;
    },
    async createPlayer(name) {
      const player = {
        playerID: `id-${nextId++}`,
        playerName: name.trim(),
        playerNameLower: name.trim().toLowerCase(),
        wins: 0,
        losses: 0,
      };
      rows.set(player.playerID, player);
      return player;
    },
    async updatePlayerStats(id, { wins, losses }) {
      if (!rows.has(id)) return null;
      const updated = { ...rows.get(id), wins, losses };
      rows.set(id, updated);
      return updated;
    },
  };
}

describe('Hangman API', () => {
  let db;
  let app;
  beforeEach(() => {
    db = fakePlayers();
    app = createApp(db);
  });

  describe('GET /players?playerName=', () => {
    it('returns 404 for a new player', async () => {
      const res = await request(app).get('/players').query({ playerName: 'Brock' });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Player not found');
    });

    it('returns the player when found (case-insensitive)', async () => {
      await db.createPlayer('Brock');
      const res = await request(app).get('/players').query({ playerName: 'brock' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ playerName: 'Brock', wins: 0, losses: 0 });
    });

    it('returns 400 when playerName is missing', async () => {
      const res = await request(app).get('/players');
      expect(res.status).toBe(400);
    });

    it('returns 400 when playerName is too long', async () => {
      const res = await request(app).get('/players').query({ playerName: 'x'.repeat(31) });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /players', () => {
    it('creates a player with a playerID and 0 wins / 0 losses', async () => {
      const res = await request(app).post('/players').send({ playerName: '  Nya ' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ playerName: 'Nya', wins: 0, losses: 0 });
      expect(res.body.playerID).toBeTruthy();
    });

    it('returns 409 and the existing player if the name is taken', async () => {
      const first = await request(app).post('/players').send({ playerName: 'Brock' });
      const res = await request(app).post('/players').send({ playerName: 'BROCK' });
      expect(res.status).toBe(409);
      expect(res.body.player.playerID).toBe(first.body.playerID);
    });

    it('returns 400 without a playerName', async () => {
      const res = await request(app).post('/players').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 for a blank playerName', async () => {
      const res = await request(app).post('/players').send({ playerName: '   ' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /players/:playerID', () => {
    it('updates wins and losses', async () => {
      const { playerID } = await db.createPlayer('Brock');
      const res = await request(app).put(`/players/${playerID}`).send({ wins: 4, losses: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ playerID, wins: 4, losses: 1 });
      expect(db.rows.get(playerID).wins).toBe(4);
    });

    it('returns 404 for an unknown player', async () => {
      const res = await request(app).put('/players/does-not-exist').send({ wins: 1, losses: 0 });
      expect(res.status).toBe(404);
    });

    it.each([
      [{ wins: -1, losses: 0 }],
      [{ wins: 1.5, losses: 0 }],
      [{ wins: '3', losses: 0 }],
      [{ wins: 3 }],
    ])('returns 400 for invalid stats %j', async (body) => {
      const { playerID } = await db.createPlayer('Brock');
      const res = await request(app).put(`/players/${playerID}`).send(body);
      expect(res.status).toBe(400);
    });
  });

  it('allows requests from the React app (CORS)', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('returns 500 if the database fails', async () => {
    const broken = createApp({
      ...db,
      findPlayerByName: async () => {
        throw new Error('DynamoDB is down');
      },
    });
    const res = await request(broken).get('/players').query({ playerName: 'Brock' });
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Server error');
  });
});
