import React, { Component } from 'react';
import Header from './components/Header';
import HangmanDrawing from './components/HangmanDrawing';
import WordDisplay from './components/WordDisplay';
import Keyboard from './components/Keyboard';
import GuessedLetters from './components/GuessedLetters';
import GameOverModal from './components/GameOverModal';
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
    };
  }

  // Lifecycle: let the player type letters on a physical keyboard too.
  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
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

  // Hint: reveals one hidden letter but costs a life (adds a wrong "miss").
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
  scoreUpdate(prev, next) {
    const before = this.getStatus(prev);
    const after = this.getStatus(next);
    if (before !== 'playing' || after === 'playing') return {};
    if (after === 'won') return { wins: prev.wins + 1, streak: prev.streak + 1 };
    return { losses: prev.losses + 1, streak: 0 };
  }

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
    const status = this.getStatus();
    const livesLost = this.getLivesLost();
    const livesLeft = MAX_LIVES - livesLost;
    const hintDisabled = hintUsed || status !== 'playing' || livesLeft <= 1;

    return (
      <div className="app">
        <Header
          wins={wins}
          losses={losses}
          streak={streak}
          onNewGame={this.newGame}
        />

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
            wins={wins}
            losses={losses}
            streak={streak}
            onNewGame={this.newGame}
          />
        )}
      </div>
    );
  }
}

export default App;
