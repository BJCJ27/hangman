import React, { Component } from 'react';
import { winPercentage } from '../utils/stats';

const SAVE_TEXT = {
  saving: 'Saving…',
  saved: 'Stats saved',
  error: "Couldn't save stats — they'll save after your next game",
};

// Shows the logged-in player's name, record and winning percentage.
class PlayerStats extends Component {
  render() {
    const { playerName, wins, losses, isNewPlayer, saveStatus, onLogout } = this.props;
    const percent = winPercentage(wins, losses);

    return (
      <section className="player" aria-label="Player stats">
        <div className="player__who">
          <span className="player__greeting">{isNewPlayer ? 'Welcome,' : 'Welcome back,'}</span>
          <span className="player__name">{playerName}</span>
        </div>

        <div className="player__numbers">
          <div className="player__stat">
            <strong data-testid="win-percentage">{percent}%</strong>
            <span>Win rate</span>
          </div>
          <div className="player__stat">
            <strong>{wins}</strong>
            <span>Wins</span>
          </div>
          <div className="player__stat">
            <strong>{losses}</strong>
            <span>Losses</span>
          </div>
        </div>

        <div className="player__side">
          {saveStatus && (
            <span className={`player__save player__save--${saveStatus}`} role="status">
              {SAVE_TEXT[saveStatus]}
            </span>
          )}
          <button className="btn btn--ghost" onClick={onLogout}>
            Switch player
          </button>
        </div>
      </section>
    );
  }
}

export default PlayerStats;
