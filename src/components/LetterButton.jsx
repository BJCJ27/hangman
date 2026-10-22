import React, { Component } from 'react';

// One key. It only knows its own letter and status; clicking it tells the
// parent which letter was picked through the onGuess callback.
class LetterButton extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.props.onGuess(this.props.letter);
  }

  render() {
    const { letter, status, disabled } = this.props;
    const label = {
      available: `Guess ${letter}`,
      correct: `${letter}, used, in the word`,
      wrong: `${letter}, used, not in the word`,
    }[status];
    return (
      <button
        className={`key key--${status}`}
        onClick={this.handleClick}
        disabled={disabled}
        aria-label={label}
      >
        {letter}
      </button>
    );
  }
}

export default LetterButton;
