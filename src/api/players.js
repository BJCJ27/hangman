// Calls to the Hangman API (server/). Every function uses fetch + async/await.
// In Docker and in local dev the API runs on port 4000.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Small helper: send a request and read the JSON body (if there is one).
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    // fetch only throws when the server can't be reached at all
    throw new Error("Can't reach the server. Is the API running?");
  }
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

// GET /players?playerName=... → the player, or null if they're new (404).
export async function getPlayer(playerName) {
  const { response, data } = await request(`/players?playerName=${encodeURIComponent(playerName)}`);
  if (response.status === 404) return null; // new player — not an error
  if (!response.ok) throw new Error(data.message || 'Could not look up player');
  return data;
}

// POST /players → the newly created player.
export async function createPlayer(playerName) {
  const { response, data } = await request('/players', {
    method: 'POST',
    body: JSON.stringify({ playerName }),
  });
  if (response.status === 409) return data.player; // someone just created them — use that one
  if (!response.ok) throw new Error(data.message || 'Could not create player');
  return data;
}

// PUT /players/:playerID → the player with saved wins/losses.
export async function updatePlayerStats(playerID, { wins, losses }) {
  const { response, data } = await request(`/players/${encodeURIComponent(playerID)}`, {
    method: 'PUT',
    body: JSON.stringify({ wins, losses }),
  });
  if (!response.ok) throw new Error(data.message || 'Could not save stats');
  return data;
}
