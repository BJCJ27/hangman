import React, { Component } from 'react';
import LetterButton from './LetterButton';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// The A–Z on-screen keyboard. Renders one LetterButton per letter with .map()
// and works out each button's status from the props it gets.
class Keyboard extends Component {
  render() {
    const { guessed, word, disabled, onGuess } = this.props;
    return (
      <div className="keyboard" role="group" aria-label="Choose a letter">
        {ALPHABET.map((letter) => {
          let status = 'available';
          if (guessed.includes(letter)) status = word.includes(letter) ? 'correct' : 'wrong';
          return (
            <LetterButton
              key={letter}
              letter={letter}
              status={status}
              disabled={disabled || status !== 'available'}
              onGuess={onGuess}
            />
          );
        })}
      </div>
    );
  }
}

export default Keyboard;
