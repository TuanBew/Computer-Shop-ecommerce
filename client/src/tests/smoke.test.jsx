import { describe, it, expect } from 'vitest';

describe('Client test suite wired correctly', () => {
  it('should run a trivial assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
