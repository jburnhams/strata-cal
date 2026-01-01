// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarPreview } from '@/src/components/CalendarPreview';
import { MonthData, FontStyle, TextPosition } from '@/src/types';
import { describe, it, expect, vi } from 'vitest';

// Mock dateService since we don't want to test its logic here, just the UI
vi.mock('@/src/services/dateService', () => ({
  generateMonthGrid: vi.fn().mockReturnValue(Array(35).fill({
    date: new Date(2024, 0, 1),
    isCurrentMonth: true,
    holidays: []
  }))
}));

describe('CalendarPreview', () => {
  const mockMonthData: MonthData = {
    monthIndex: 0,
    name: 'January',
    days: 31,
    startDay: 0,
    image: null,
    accentColor: '#000000',
    fontFamily: 'sans-serif',
    fontStyle: FontStyle.Serif,
    textPosition: TextPosition.BottomRight,
    layout: 'bottom',
    isDefault: false,
    isAnalyzing: false,
  };

  const mockOnUpload = vi.fn();
  const mockOnColorChange = vi.fn();
  const mockOnTextPositionChange = vi.fn();
  const mockOnFontStyleChange = vi.fn();

  it('renders correctly', () => {
    render(
      <CalendarPreview
        year={2024}
        monthData={[mockMonthData]}
      />
    );

    // "January" appears in h1 (draggable title) and h2 (calendar header)
    const monthNames = screen.getAllByText('January');
    expect(monthNames).toHaveLength(2);

    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('renders image when provided', () => {
    const dataWithImage = { ...mockMonthData, image: 'base64string' };
    render(
      <CalendarPreview
        year={2024}
        monthData={[dataWithImage]}
      />
    );

    const img = screen.getByAltText('Month Background');
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,base64string');
  });

  it('calls onUpload when file is selected', () => {
    render(
      <CalendarPreview
        year={2024}
        monthData={[mockMonthData]}
        onUpload={mockOnUpload}
        isInteractive={true}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnUpload).toHaveBeenCalledWith(file, 0);
  });

  it('calls onColorChange when color is changed', () => {
    render(
      <CalendarPreview
        year={2024}
        monthData={[mockMonthData]}
        onColorChange={mockOnColorChange}
        isInteractive={true}
      />
    );

    const input = document.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '#ff0000' } });

    expect(mockOnColorChange).toHaveBeenCalledWith('#ff0000', 0);
  });

  it('renders title with correct style', () => {
    const dataWithStyle = { ...mockMonthData, fontStyle: FontStyle.Handwriting };
    render(
        <CalendarPreview
            year={2024}
            monthData={[dataWithStyle]}
        />
    );
    const title = screen.getByRole('heading', { level: 1, name: 'January' });
    expect(title).toHaveClass('font-handwriting');
  });

  it('opens font menu when clicking title in interactive mode', () => {
      render(
          <CalendarPreview
              year={2024}
              monthData={[mockMonthData]}
              isInteractive={true}
              onFontStyleChange={mockOnFontStyleChange}
              onTextPositionChange={mockOnTextPositionChange}
          />
      );

      const title = screen.getByRole('heading', { level: 1, name: 'January' });
      // The click handler is on the parent div of the h1
      fireEvent.click(title.parentElement!);

      expect(screen.getByText('Select Font')).toBeInTheDocument();
  });

  it('calls onFontStyleChange when selecting a font', () => {
      render(
          <CalendarPreview
              year={2024}
              monthData={[mockMonthData]}
              isInteractive={true}
              onFontStyleChange={mockOnFontStyleChange}
              onTextPositionChange={mockOnTextPositionChange}
          />
      );

      const title = screen.getByRole('heading', { level: 1, name: 'January' });
      fireEvent.click(title.parentElement!);

      const handwritingOption = screen.getByText('Handwriting').closest('button');
      fireEvent.click(handwritingOption!);

      expect(mockOnFontStyleChange).toHaveBeenCalledWith(FontStyle.Handwriting, 0);
  });

  // Need to test dragging if possible, or at least that event listeners are attached
  // Testing drag in JSDOM is complex as it involves calculating coordinates.
  // We can simulate mousedown, mousemove, mouseup.

  it('handles drag interactions', () => {
       render(
          <CalendarPreview
              year={2024}
              monthData={[mockMonthData]}
              isInteractive={true}
              onTextPositionChange={mockOnTextPositionChange}
          />
      );

      const titleContainer = screen.getByRole('heading', { level: 1, name: 'January' }).parentElement!;

      // We need to mock offsetParent and getBoundingClientRect for drag calculations
      Object.defineProperty(titleContainer, 'offsetParent', {
          get: () => ({
              getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
          })
      });

      vi.spyOn(titleContainer, 'getBoundingClientRect').mockReturnValue({
          left: 100, top: 100, width: 200, height: 100,
          bottom: 200, right: 300, x: 100, y: 100, toJSON: () => {}
      });

      // Mouse down
      fireEvent.mouseDown(titleContainer, { clientX: 110, clientY: 110 });

      // Mouse move
      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });

      // Should call onPositionChange
      expect(mockOnTextPositionChange).toHaveBeenCalled();

      // Mouse up
      fireEvent.mouseUp(window);
  });

  it('applies custom text position coordinates', () => {
      const dataWithCoords = {
          ...mockMonthData,
          textPositionCoords: { x: 50, y: 50 }
      };

      render(
          <CalendarPreview
              year={2024}
              monthData={[dataWithCoords]}
          />
      );

      const titleContainer = screen.getByRole('heading', { level: 1, name: 'January' }).parentElement!;
      expect(titleContainer).toHaveStyle({ left: '50%', top: '50%' });
  });

});
