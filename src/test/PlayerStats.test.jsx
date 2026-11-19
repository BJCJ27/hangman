import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerStats from '../components/PlayerStats';

const renderStats = (props = {}) =>
  render(
    <PlayerStats
      playerName="Brock"
      wins={3}
      losses={1}
      isNewPlayer={false}
      saveStatus={null}
      onLogout={() => {}}
      {...props}
    />,
  );

describe('PlayerStats', () => {
  it('shows the player name', () => {
    renderStats();
    expect(screen.getByText('Brock')).toBeInTheDocument();
  });

  it('shows the winning percentage', () => {
    renderStats({ wins: 3, losses: 1 });
    expect(screen.getByTestId('win-percentage')).toHaveTextContent('75%');
  });

  it('shows 0% for a brand-new player', () => {
    renderStats({ wins: 0, losses: 0, isNewPlayer: true });
    expect(screen.getByTestId('win-percentage')).toHaveTextContent('0%');
    expect(screen.getByText('Welcome,')).toBeInTheDocument();
  });

  it('welcomes back a returning player', () => {
    renderStats({ isNewPlayer: false });
    expect(screen.getByText('Welcome back,')).toBeInTheDocument();
  });

  it('shows the wins and losses', () => {
    renderStats({ wins: 7, losses: 2 });
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onLogout when Switch player is clicked', async () => {
    const onLogout = vi.fn();
    renderStats({ onLogout });
    await userEvent.click(screen.getByRole('button', { name: 'Switch player' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
