import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../components/LoginForm';

describe('LoginForm', () => {
  it('disables Log in until a name is typed', async () => {
    render(<LoginForm onLogin={() => {}} />);
    const button = screen.getByRole('button', { name: 'Log in' });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Player name'), 'Brock');
    expect(button).toBeEnabled();
  });

  it('sends the trimmed name to onLogin', async () => {
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText('Player name'), '  Brock  ');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(onLogin).toHaveBeenCalledWith('Brock');
  });

  it('logs in when Enter is pressed', async () => {
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText('Player name'), 'Brock{Enter}');
    expect(onLogin).toHaveBeenCalledWith('Brock');
  });

  it('does not log in with only spaces', async () => {
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText('Player name'), '   {Enter}');
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('shows an error message from the API', () => {
    render(<LoginForm onLogin={() => {}} error="Can't reach the server. Is the API running?" />);
    expect(screen.getByRole('alert')).toHaveTextContent("Can't reach the server");
  });

  it('shows a loading state while checking', () => {
    render(<LoginForm onLogin={() => {}} loading />);
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
  });
});
