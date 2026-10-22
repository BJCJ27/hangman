// Word bank, grouped by category. Every word is uppercase letters only.
export const WORD_BANK = {
  Programming: ['JAVASCRIPT', 'COMPONENT', 'VARIABLE', 'FUNCTION', 'DOCKER', 'BROWSER', 'PROPS', 'STATE'],
  Animals: ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'DOLPHIN', 'KANGAROO', 'OCTOPUS', 'CHEETAH'],
  Atlanta: ['PEACHTREE', 'FALCONS', 'HAWKS', 'MARTA', 'BRAVES', 'MIDTOWN', 'BUCKHEAD'],
  Food: ['PIZZA', 'SPAGHETTI', 'PANCAKE', 'BURRITO', 'AVOCADO', 'CHEESECAKE', 'NOODLES'],
};

export const CATEGORIES = Object.keys(WORD_BANK);

// Pick a random word. If a category is given, pick from that category only.
export function getRandomWord(category) {
  const chosen = category && WORD_BANK[category]
    ? category
    : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const words = WORD_BANK[chosen];
  return { word: words[Math.floor(Math.random() * words.length)], category: chosen };
}
