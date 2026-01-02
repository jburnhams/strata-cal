/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
});
