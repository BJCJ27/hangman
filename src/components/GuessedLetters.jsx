import React, { Component } from 'react';

// Lists every letter the user has chosen, split into hits and misses.
class GuessedLetters extends Component {
  render() {
    const { guessed, word } = this.props;
    const hits = guessed.filter((l) => word.includes(l));
    const misses = guessed.filter((l) => !word.includes(l));

    return (
      <div className="guessed">
        <p>
          <span className="guessed__label">Correct:</span>
          {hits.length ? hits.map((l) => <span key={l} className="guessed__hit">{l}</span>) : <em>none yet</em>}
        </p>
        <p>
          <span className="guessed__label">Missed:</span>
          {misses.length ? misses.map((l) => <span key={l} className="guessed__miss">{l}</span>) : <em>none yet</em>}
        </p>
      </div>
    );
  }
}

export default GuessedLetters;
