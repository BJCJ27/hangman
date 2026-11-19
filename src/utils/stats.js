// Winning percentage as a whole number (0–100). No games played → 0.
export function winPercentage(wins, losses) {
  const games = wins + losses;
  if (games === 0) return 0;
  return Math.round((wins / games) * 100);
}
