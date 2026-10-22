# AI Contribution Statement

## 1. Tools used

Claude (Anthropic, Opus 5.5), used through the Claude app. No other AI tools or
autocomplete were used.

## 2. Prompts

First I asked it for a rough list of what a hangman game should have, then for
a paper-prototype style mockup of the game screen and the game-over screen.
After that I gave it the full assignment: build the hangman game with React
from chapter 2, start it with Vite from the command line, split it into
multiple components, run it in Docker, write a README that follows
makeareadme.com, and match the features from the prototype (current hangman
picture with 6 images for 5 lives, letter selection, showing chosen letters, a
New Game button, and a win/lose pop-up). I told it to use my last homework
(Pet Kennel) for the Dockerfile, docker-compose and this AI contribution format.
After the first version, I asked it to change the keyboard so every letter I
use turns grey, and letters that aren't in the word also get an X over them.
I also asked it to play the game in a browser and take screenshots so I could
check that winning, losing, the hint and New Game all worked.

## 3. What it got wrong

- **Old Node version in Docker.** The Dockerfile from the last homework uses
  `node:18-alpine`, but the current Vite (version 8) needs Node 20.19 or newer,
  so copying it as-is would have broken the container. We changed it to
  `node:22-alpine` and noted the reason in the Dockerfile.
- **The first version of the hint was a hack.** To make the hint cost a life,
  it first added a random wrong letter to the guessed list. That would have
  shown a letter in "Missed" that I never picked. We changed it so the hint is
  tracked separately (`hintUsed`) and lives lost = wrong letters + 1 if the
  hint was used.
- **Method name that looked like a Hook.** The hint method was first called
  `useHint`. Names starting with `use` are meant for React Hooks, and this is a
  class method, so it was renamed to `giveHint`.
- **Screenshot timing.** The first screenshot of the loss pop-up was taken
  while the pop-up was still fading in, so it looked see-through. We waited for
  the animation to finish and retook it.

## 4. Reflection

The main idea is that `App` is the only component with state. It keeps the
word, the guessed letters, whether the hint was used, and the score. Everything
else (lives lost, wrong letters, whether the game is won or lost) is
**calculated** from that state each render instead of being stored, so it can
never get out of sync. The child components (`Header`, `HangmanDrawing`,
`WordDisplay`, `GuessedLetters`, `Keyboard`, `LetterButton`, `GameOverModal`)
just show the props they get. When the player clicks a key, `LetterButton`
calls `this.props.onGuess(letter)`, which goes back up through `Keyboard` to
`App.guessLetter`, which copies the guessed array with the spread operator and
calls `setState`. React then re-renders and every child updates. The pop-up is
conditional rendering: it only exists when the status is `won` or `lost`. The
physical-keyboard support uses `componentDidMount` to add a listener and
`componentWillUnmount` to remove it. I can explain every file in the project.
