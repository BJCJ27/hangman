import React, { Component } from 'react';
import { STAGES } from '../data/stages';

// Shows the hangman picture for the current number of lives lost,
// plus a row of dots for the lives that are left.
class HangmanDrawing extends Component {
  render() {
    const { livesLost, livesLeft, maxLives } = this.props;
    const stage = Math.min(livesLost, STAGES.length - 1);

    return (
      <section className="gallows" aria-label="Hangman">
        <img
          className="gallows__img"
          src={STAGES[stage]}
          alt={`Hangman drawing, stage ${stage} of ${maxLives}`}
        />
        <p className="gallows__label">Lives left</p>
        <div className="lives" aria-label={`${livesLeft} of ${maxLives} lives left`}>
          {Array.from({ length: maxLives }, (_, i) => (
            <span key={i} className={`life ${i < livesLeft ? 'life--on' : ''}`} />
          ))}
        </div>
        <p className="gallows__count">{livesLost} / {maxLives} lost</p>
      </section>
    );
  }
}

export default HangmanDrawing;
