// Tests the whole login → play → save flow in App, with fetch faked so no
// real server is needed.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Always use the word "CAT" so the test knows which letters win or lose.
vi.mock('../data/words', () => ({
  CATEGORIES: ['Animals'],
  getRandomWord: () => ({ word: 'CAT', category: 'Animals' }),
}));

import App from '../App';

const jsonResponse = (status, body) =>
  Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) });

const BROCK = { playerID: 'id-123', playerName: 'Brock', wins: 3, losses: 1 };

const logIn = async (name = 'Brock') => {
  await userEvent.type(screen.getByLabelText('Player name'), name);
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
};

const guess = (letters) =>
  letters.split('').reduce(
    (p, l) => p.then(() => userEvent.click(screen.getByRole('button', { name: `Guess ${l}` }))),
    Promise.resolve(),
  );

describe('App — player login and stats', () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('logs in an existing player with a GET and hides the login button', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(200, BROCK));
    render(<App />);
    await logIn();

    expect(await screen.findByText('Brock')).toBeInTheDocument();
    expect(screen.getByText('Welcome back,')).toBeInTheDocument();
    expect(screen.getByTestId('win-percentage')).toHaveTextContent('75%');
    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/players?playerName=Brock');
    expect(options.method).toBeUndefined(); // GET
  });

  it('creates a new player with a POST when the GET returns 404', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(404, { message: 'Player not found' }))
      .mockReturnValueOnce(jsonResponse(201, { playerID: 'new-1', playerName: 'Nya', wins: 0, losses: 0 }));
    render(<App />);
    await logIn('Nya');

    expect(await screen.findByText('Nya')).toBeInTheDocument();
    expect(screen.getByText('Welcome,')).toBeInTheDocument();
    expect(screen.getByTestId('win-percentage')).toHaveTextContent('0%');

    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toMatch(/\/players$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ playerName: 'Nya' });
  });

  it('shows an error if the server cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<App />);
    await logIn();
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't reach the server");
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('updates stats in React, then PUTs them when the player wins', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(200, BROCK))
      .mockReturnValueOnce(jsonResponse(200, { ...BROCK, wins: 4 }));
    render(<App />);
    await logIn();
    await screen.findByText('Brock');

    await guess('CAT');

    // Local state updated right away: 4 wins, 1 loss → 80%
    expect(screen.getByTestId('win-percentage')).toHaveTextContent('80%');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toContain('/players/id-123');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ wins: 4, losses: 1 });
    expect(await screen.findByText('Stats saved')).toBeInTheDocument();
  });

  it('PUTs a loss when the player runs out of lives', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(200, BROCK))
      .mockReturnValueOnce(jsonResponse(200, { ...BROCK, losses: 2 }));
    render(<App />);
    await logIn();
    await screen.findByText('Brock');

    await guess('BDEFG'); // 5 wrong letters → lost

    expect(screen.getByText('Out of lives!')).toBeInTheDocument();
    expect(screen.getByTestId('win-percentage')).toHaveTextContent('60%'); // 3 / 5
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ wins: 3, losses: 2 });
  });

  it('does not guess letters while typing in the name box', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText('Player name'), 'CAT');
    expect(screen.getByRole('button', { name: 'Guess C' })).toBeEnabled();
    expect(screen.queryByText('You got it!')).not.toBeInTheDocument();
  });

  it('does not call the API when a guest finishes a game', async () => {
    render(<App />);
    await guess('CAT');
    expect(screen.getByText('You got it!')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
