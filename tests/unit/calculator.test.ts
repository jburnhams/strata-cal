import { describe, it, expect } from 'vitest';
import { add, subtract, multiply, divide, percentage } from '@/src/services/calculator';

describe('Calculator Service', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
  });

  it('subtracts two numbers', () => {
    expect(subtract(5, 3)).toBe(2);
    expect(subtract(1, 1)).toBe(0);
  });

  it('multiplies two numbers', () => {
    expect(multiply(2, 3)).toBe(6);
    expect(multiply(-2, 3)).toBe(-6);
  });

  it('divides two numbers', () => {
    expect(divide(6, 2)).toBe(3);
  });

  it('throws error when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
  });

  it('calculates percentage', () => {
    expect(percentage(50, 100)).toBe(50);
    expect(percentage(25, 100)).toBe(25);
  });

  it('returns 0 when calculating percentage with total 0', () => {
    expect(percentage(50, 0)).toBe(0);
  });
});
