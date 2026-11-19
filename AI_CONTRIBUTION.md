# AI Contribution Statement

## 1. Tools used

Claude (Anthropic, Opus 5.5), used through the Claude app. No other AI tools or
autocomplete were used. I used Postman to try the API myself.

## 2. Prompts

### Version 1: the game

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

### Version 2: players and DynamoDB

I gave it the new assignment: track the current player with a `playerID`
primary key, track their wins and losses, show the player name and winning
percentage on the frontend, check for the player with a GET (query, not scan),
handle the 404 for new players by adding them with a POST, remove the login
button with a boolean once logged in, keep the player's stats in React state
and update them locally before a PUT when the game ends, use fetch with
async/await, run DynamoDB Local in Docker Compose, use cors, and update the
README for compose, testing and the server files. I also asked for the extra
credit: unit tests for the player name and stats in the UI, and for the API. I
pointed it to the class resources (the Medium article on DynamoDB in Docker, the
AWS SDK getting-started docs, and the npm cors article) and my GitHub repo for
the version 1 code.

## 3. What it got wrong or had to fix

### Version 1

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

### Version 2

- **Typing your name would have played the game.** The game listens for key
  presses on the whole page, so typing "CAT" into the name box would also have
  guessed C, A and T. We added a check in `handleKeyDown` that ignores keys
  typed into inputs, and a unit test for it. We confirmed the test really
  catches the bug by removing the fix and watching the test fail.
- **Looking up by name needs an index.** `playerID` is the primary key, so
  DynamoDB can't Query by name on the table itself. Without an index the only
  option is a Scan, which reads every player. We added a global secondary index
  (`PlayerNameIndex`) and query that instead. We also store the name in
  lowercase for the index, so "Brock" and "brock" are the same player instead of
  two accounts.
- **A 404 isn't an error here.** The first thought was to treat any non-OK
  response as a failure, but for this assignment a 404 on the GET just means
  "new player". `getPlayer()` returns `null` on a 404, and the login then does
  the POST.
- **DynamoDB Local starts slower than the API.** `depends_on` only waits for the
  container to start, not for the database to be ready, so the API would crash
  trying to create the table. `ensureTable()` now retries for up to 30 seconds.
- **The PUT could create a player.** DynamoDB's Update creates the item if it
  doesn't exist, so a PUT with a wrong `playerID` would have made a new,
  nameless player. We added `ConditionExpression: attribute_exists(playerID)`,
  and the API returns 404 instead.
- **Its workspace couldn't download Docker images.** It tested the API against
  a local DynamoDB emulator (moto) instead of the real DynamoDB Local image,
  and checked the compose file with `docker compose config`. Running all three
  real containers with `docker compose up --build` has to be checked on my own
  machine.
- **An outdated comment.** A code comment about the hint still described the old
  "fake miss" version. It was fixed.

## 4. Reflection

### Version 1

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
`componentWillUnmount` to remove it.

### Version 2

The new pieces follow the same pattern. `App` holds the player (`player`,
`isLoggedIn`), and the new components `LoginForm` and `PlayerStats` just show
props and call callbacks.

**Login:** `LoginForm` has a controlled input and calls `onLogin(name)`.
`App.handleLogin` is an `async` method. It `await`s `getPlayer(name)`, which
sends `GET /players?playerName=`. If that returns `null` (the 404), it `await`s
`createPlayer(name)`, which sends a POST. Then it sets `isLoggedIn: true`, and
the `isLoggedIn ? <PlayerStats/> : <LoginForm/>` check removes the login button.

**Saving stats:** when a game ends, `scoreUpdate()` adds the win or loss to
`player` in state, so the screen updates immediately. Then
`componentDidUpdate` notices that the same player's wins or losses changed and
calls `saveStats`, which sends `PUT /players/:playerID` with the new totals.

**The server** has three layers: `app.js` (routes and checking the input),
`players.js` (the only file that talks to DynamoDB) and `db.js` (the
connection). Because the routes get the database functions passed in, the
tests can use a fake database. The table uses a random UUID as `playerID`, so
two people with the same name never overwrite each other.

**Docker Compose** runs three containers. The API reaches the database at
`http://dynamodb:8000`, using the service name as the hostname. The browser
reaches the API at `localhost:4000`, which is why the API needs `cors()`. I can
explain every file in the project.
