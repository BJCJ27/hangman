import React, { Component } from 'react';

// Name box + Log in button. The input is "controlled": its value lives in
// state, so React always knows what's typed. Shown only while logged out.
class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.state = { name: '' };
  }

  handleChange = (event) => {
    this.setState({ name: event.target.value });
  };

  handleSubmit = (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    const name = this.state.name.trim();
    if (name) this.props.onLogin(name);
  };

  render() {
    const { loading, error } = this.props;
    const empty = this.state.name.trim() === '';

    return (
      <form className="login" onSubmit={this.handleSubmit}>
        <label className="login__label" htmlFor="player-name">
          Player name
        </label>
        <div className="login__row">
          <input
            id="player-name"
            className="login__input"
            type="text"
            value={this.state.name}
            onChange={this.handleChange}
            placeholder="Enter your name"
            maxLength={30}
            autoComplete="off"
            disabled={loading}
          />
          <button className="btn btn--primary" type="submit" disabled={empty || loading}>
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </div>
        <p className="login__note">
          {error ? (
            <span className="login__error" role="alert">{error}</span>
          ) : (
            'New here? Enter a name and your stats will be saved.'
          )}
        </p>
      </form>
    );
  }
}

export default LoginForm;
