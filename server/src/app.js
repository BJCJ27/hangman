// The Express app and its routes. It receives the "players" data functions as
// an argument, so the unit tests can pass in a fake database.
import express from 'express';
import cors from 'cors';
import defaultPlayers from './players.js';

const MAX_NAME_LENGTH = 30;

const isValidName = (name) =>
  typeof name === 'string' && name.trim().length > 0 && name.trim().length <= MAX_NAME_LENGTH;

const isCount = (n) => Number.isInteger(n) && n >= 0;

export function createApp(players = defaultPlayers) {
  const app = express();

  // CORS: the React app (port 3000/5173) calls this API on a different port (4000).
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // GET /players?playerName=Brock -> 200 with the player, or 404 if new
  app.get('/players', async (req, res) => {
    const { playerName } = req.query;
    if (!isValidName(playerName)) {
      return res.status(400).json({ message: 'playerName query parameter is required (1-30 characters)' });
    }
    const player = await players.findPlayerByName(playerName);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  });

  // POST /players  body: { "playerName": "Brock" } -> 201 with the new player
  app.post('/players', async (req, res) => {
    const { playerName } = req.body ?? {};
    if (!isValidName(playerName)) {
      return res.status(400).json({ message: 'playerName is required (1-30 characters)' });
    }
    const existing = await players.findPlayerByName(playerName);
    if (existing) {
      return res.status(409).json({ message: 'Player already exists', player: existing });
    }
    const player = await players.createPlayer(playerName);
    res.status(201).json(player);
  });

  // PUT /players/:playerID  body: { "wins": 3, "losses": 1 } -> 200 with the updated player
  app.put('/players/:playerID', async (req, res) => {
    const { wins, losses } = req.body ?? {};
    if (!isCount(wins) || !isCount(losses)) {
      return res.status(400).json({ message: 'wins and losses must be whole numbers 0 or higher' });
    }
    const player = await players.updatePlayerStats(req.params.playerID, { wins, losses });
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  });

  // Anything that throws (e.g. DynamoDB is down) ends up here.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  });

  return app;
}
