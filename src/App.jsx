import React, { Component } from 'react';
import Header from './components/Header';
import HangmanDrawing from './components/HangmanDrawing';
import WordDisplay from './components/WordDisplay';
import Keyboard from './components/Keyboard';
import GuessedLetters from './components/GuessedLetters';
import GameOverModal from './components/GameOverModal';
import LoginForm from './components/LoginForm';
import PlayerStats from './components/PlayerStats';
import { getPlayer, createPlayer, updatePlayerStats } from './api/players';
import { getRandomWord, CATEGORIES } from './data/words';
import { MAX_LIVES } from './data/stages';
import './App.css';

// App is the parent: it owns ALL the game state and the methods that change it.
// Every child component only receives props and calls the callbacks it is given.
class App extends Component {
  constructor(props) {
    super(props);
    const { word, category } = getRandomWord();

    // STATE — everything the game needs to remember.
    this.state = {
      word,
      category,
      guessed: [],        // every letter the player has picked, in order
      hintUsed: false,
      wins: 0,
      losses: 0,
      streak: 0,
      categoryChoice: 'Random',

      // PLAYER — saved in DynamoDB through the API
      player: null,          // { playerID, playerName, wins, losses } once logged in
      isLoggedIn: false,     // true → hide the login form, show the player's stats
      isNewPlayer: false,    // true when this login created the player
      loginLoading: false,
      loginError: null,
      saveStatus: null,      // 'saving' | 'saved' | 'error'
    };
  }

  // Lifecycle: let the player type letters on a physical keyboard too.
  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  // After a game ends, the player's stats were already updated locally in
  // scoreUpdate(). Here we notice that change and save it with a PUT request.
  componentDidUpdate(prevProps, prevState) {
    const before = prevState.player;
    const after = this.state.player;
    const samePlayer = before && after && before.playerID === after.playerID;
    if (samePlayer && (before.wins !== after.wins || before.losses !== after.losses)) {
      this.saveStats(after);
    }
  }

  handleKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // Typing your name in the login box shouldn't guess letters
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    const key = event.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) this.guessLetter(key);
    if (event.key === 'Enter' && this.getStatus() !== 'playing') this.newGame();
  };

  // --- Derived values (computed from state, not stored) ---------------------

  getWrongGuesses(state = this.state) {
    return state.guessed.filter((letter) => !state.word.includes(letter));
  }

  // Lives lost = wrong letters, plus 1 if the hint was used.
  getLivesLost(state = this.state) {
    return this.getWrongGuesses(state).length + (state.hintUsed ? 1 : 0);
  }

  getStatus(state = this.state) {
    const solved = state.word.split('').every((letter) => state.guessed.includes(letter));
    if (solved) return 'won';
    if (this.getLivesLost(state) >= MAX_LIVES) return 'lost';
    return 'playing';
  }

  // --- Event methods, passed down to children as props ---------------------

  // Called by Keyboard (and the physical keyboard) when a letter is picked.
  guessLetter = (letter) => {
    this.setState((prev) => {
      if (this.getStatus(prev) !== 'playing' || prev.guessed.includes(letter)) return null;
      const next = { ...prev, guessed: [...prev.guessed, letter] };
      return { guessed: next.guessed, ...this.scoreUpdate(prev, next) };
    });
  };

  // Hint: reveals one hidden letter but costs a life (counted through hintUsed).
  giveHint = () => {
    this.setState((prev) => {
      if (prev.hintUsed || this.getStatus(prev) !== 'playing') return null;
      if (this.getLivesLost(prev) >= MAX_LIVES - 1) return null; // would lose the game
      const hidden = [...new Set(prev.word.split(''))].filter((l) => !prev.guessed.includes(l));
      const reveal = hidden[Math.floor(Math.random() * hidden.length)];
      const next = { ...prev, guessed: [...prev.guessed, reveal], hintUsed: true };
      return { guessed: next.guessed, hintUsed: true, ...this.scoreUpdate(prev, next) };
    });
  };

  // Update wins/losses/streak once, at the moment a game ends.
  // If a player is logged in, their stats are updated here too — locally in
  // React first; componentDidUpdate then sends the PUT request.
  scoreUpdate(prev, next) {
    const before = this.getStatus(prev);
    const after = this.getStatus(next);
    if (before !== 'playing' || after === 'playing') return {};

    const won = after === 'won';
    const update = won
      ? { wins: prev.wins + 1, streak: prev.streak + 1 }
      : { losses: prev.losses + 1, streak: 0 };

    if (prev.player) {
      update.player = {
        ...prev.player,
        wins: prev.player.wins + (won ? 1 : 0),
        losses: prev.player.losses + (won ? 0 : 1),
      };
    }
    return update;
  }

  // --- Player / API methods -------------------------------------------------

  // LOGIN — GET the player by name. A 404 means they're new, so POST them.
  handleLogin = async (playerName) => {
    this.setState({ loginLoading: true, loginError: null });
    try {
      let player = await getPlayer(playerName);
      let isNewPlayer = false;
      if (!player) {
        player = await createPlayer(playerName);
        isNewPlayer = true;
      }
      this.setState({ player, isLoggedIn: true, isNewPlayer, loginLoading: false, saveStatus: null });
    } catch (error) {
      this.setState({ loginError: error.message, loginLoading: false });
    }
  };

  handleLogout = () => {
    this.setState({ player: null, isLoggedIn: false, isNewPlayer: false, saveStatus: null });
  };

  // PUT the player's current totals to the API.
  saveStats = async (player) => {
    this.setState({ saveStatus: 'saving' });
    try {
      await updatePlayerStats(player.playerID, { wins: player.wins, losses: player.losses });
      this.setState({ saveStatus: 'saved' });
    } catch {
      this.setState({ saveStatus: 'error' });
    }
  };

  // NEW GAME — pick a fresh word and clear the guesses (score is kept).
  newGame = () => {
    const pick = this.state.categoryChoice === 'Random' ? undefined : this.state.categoryChoice;
    const { word, category } = getRandomWord(pick);
    this.setState({ word, category, guessed: [], hintUsed: false });
  };

  changeCategory = (categoryChoice) => {
    this.setState({ categoryChoice }, this.newGame);
  };

  render() {
    const { word, category, guessed, hintUsed, wins, losses, streak, categoryChoice } = this.state;
    const { player, isLoggedIn, isNewPlayer, loginLoading, loginError, saveStatus } = this.state;
    // Logged in → show the player's saved totals; otherwise this session's.
    const stats = isLoggedIn ? { wins: player.wins, losses: player.losses } : { wins, losses };
    const status = this.getStatus();
    const livesLost = this.getLivesLost();
    const livesLeft = MAX_LIVES - livesLost;
    const hintDisabled = hintUsed || status !== 'playing' || livesLeft <= 1;

    return (
      <div className="app">
        <Header
          wins={stats.wins}
          losses={stats.losses}
          streak={streak}
          onNewGame={this.newGame}
        />

        {isLoggedIn ? (
          <PlayerStats
            playerName={player.playerName}
            wins={player.wins}
            losses={player.losses}
            isNewPlayer={isNewPlayer}
            saveStatus={saveStatus}
            onLogout={this.handleLogout}
          />
        ) : (
          <LoginForm onLogin={this.handleLogin} loading={loginLoading} error={loginError} />
        )}

        <main className="board">
          <HangmanDrawing livesLost={livesLost} livesLeft={livesLeft} maxLives={MAX_LIVES} />

          <section className="play" aria-label="Game board">
            <div className="play__meta">
              <span className="pill pill--solid">Category: {category}</span>
              <span className="pill">{word.length} letters</span>
              <label className="category-select">
                <span>Next word from</span>
                <select
                  value={categoryChoice}
                  onChange={(e) => this.changeCategory(e.target.value)}
                >
                  <option>Random</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <button className="btn btn--ghost" onClick={this.giveHint} disabled={hintDisabled}>
                {hintUsed ? 'Hint used' : 'Hint (costs 1 life)'}
              </button>
            </div>

            <WordDisplay word={word} guessed={guessed} revealAll={status === 'lost'} />

            <GuessedLetters guessed={guessed} word={word} />

            <Keyboard
              guessed={guessed}
              word={word}
              disabled={status !== 'playing'}
              onGuess={this.guessLetter}
            />
          </section>
        </main>

        {status !== 'playing' && (
          <GameOverModal
            status={status}
            word={word}
            livesLeft={livesLeft}
            wins={stats.wins}
            losses={stats.losses}
            streak={streak}
            onNewGame={this.newGame}
          />
        )}
      </div>
    );
  }
}

export default App;
