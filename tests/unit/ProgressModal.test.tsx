/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProgressModal } from '../../src/components/ProgressModal';

describe('ProgressModal', () => {
  it('renders correctly with given props', () => {
    render(<ProgressModal progress={5} total={10} status="Processing..." />);

    expect(screen.getByText('Generating PDF')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(<ProgressModal progress={3} total={4} status="Working" />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles zero total to avoid division by zero', () => {
    render(<ProgressModal progress={0} total={0} status="Starting" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calculates percentage correctly when progress exceeds total (robustness)', () => {
    // This simulates the scenario where calculation might be off in a way that progress > total
    render(<ProgressModal progress={20} total={10} status="Done" />);
    expect(screen.getByText('200%')).toBeInTheDocument();
  });

  it('handles large numbers correctly', () => {
     render(<ProgressModal progress={24} total={24} status="Done" />);
     expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
