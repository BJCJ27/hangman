import React, { Component } from 'react';
import { STAGES } from '../data/stages';

// Pop-up shown when the game is won or lost.
class GameOverModal extends Component {
  constructor(props) {
    super(props);
    this.buttonRef = React.createRef();
  }

  // Move keyboard focus to "Play again" when the pop-up opens.
  componentDidMount() {
    this.buttonRef.current?.focus();
  }

  render() {
    const { status, word, livesLeft, wins, losses, streak, onNewGame } = this.props;
    const won = status === 'won';

    return (
      <div className="modal-backdrop">
        <div className={`modal ${won ? 'modal--won' : 'modal--lost'}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          {!won && <img className="modal__img" src={STAGES[STAGES.length - 1]} alt="Completed hangman" />}
          <h2 id="modal-title" className="modal__title">{won ? 'You got it!' : 'Out of lives!'}</h2>
          <p className="modal__text">
            {won
              ? `Solved with ${livesLeft} ${livesLeft === 1 ? 'life' : 'lives'} to spare.`
              : 'The word was'}
          </p>
          <p className="modal__word">{word}</p>

          <div className="modal__stats">
            <div><strong>{wins}</strong><span>Wins</span></div>
            <div><strong>{losses}</strong><span>Losses</span></div>
            <div><strong>{streak}</strong><span>Streak</span></div>
          </div>

          <button ref={this.buttonRef} className="btn btn--primary" onClick={onNewGame}>
            Play again
          </button>
        </div>
      </div>
    );
  }
}

export default GameOverModal;
