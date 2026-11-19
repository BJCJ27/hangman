import { describe, it, expect } from 'vitest';
import { winPercentage } from '../utils/stats';

describe('winPercentage', () => {
  it('is 0 when no games have been played', () => {
    expect(winPercentage(0, 0)).toBe(0);
  });

  it('calculates wins out of all games', () => {
    expect(winPercentage(1, 1)).toBe(50);
    expect(winPercentage(3, 1)).toBe(75);
    expect(winPercentage(5, 0)).toBe(100);
    expect(winPercentage(0, 4)).toBe(0);
  });

  it('rounds to a whole number', () => {
    expect(winPercentage(1, 2)).toBe(33);
    expect(winPercentage(2, 1)).toBe(67);
  });
});
