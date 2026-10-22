import React, { Component } from 'react';

// The secret word as blanks. Letters appear once guessed; on a loss the
// missing letters are revealed in red.
class WordDisplay extends Component {
  render() {
    const { word, guessed, revealAll } = this.props;
    return (
      <div className="word" aria-live="polite">
        {word.split('').map((letter, i) => {
          const found = guessed.includes(letter);
          const show = found || revealAll;
          return (
            <span key={i} className={`word__slot ${!found && revealAll ? 'word__slot--missed' : ''}`}>
              {show ? letter : ''}
            </span>
          );
        })}
      </div>
    );
  }
}

export default WordDisplay;
