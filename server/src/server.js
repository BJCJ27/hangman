// Entry point: make sure the table exists, then start listening.
import { createApp } from './app.js';
import { ensureTable } from './createTable.js';

const PORT = process.env.PORT || 4000;

await ensureTable();

createApp().listen(PORT, () => {
  console.log(`Hangman API running on http://localhost:${PORT}`);
});
