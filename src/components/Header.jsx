import React, { Component } from 'react';

// Title bar with the score and the New Game button.
class Header extends Component {
  render() {
    const { wins, losses, streak, onNewGame } = this.props;
    return (
      <header className="header">
        <h1 className="header__title">Hangman</h1>
        <div className="header__stats">
          <span className="stat">Wins <strong>{wins}</strong></span>
          <span className="stat">Losses <strong>{losses}</strong></span>
          <span className="stat">Streak <strong>{streak}</strong></span>
          <button className="btn btn--primary" onClick={onNewGame}>
            New game
          </button>
        </div>
      </header>
    );
  }
}

export default Header;
