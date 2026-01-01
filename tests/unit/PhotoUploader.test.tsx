// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoUploader } from '@/src/components/PhotoUploader';
import { MonthData } from '@/src/types';
import { describe, it, expect, vi } from 'vitest';

describe('PhotoUploader', () => {
  const mockMonthData: MonthData = {
    monthIndex: 0,
    name: 'January',
    days: 31,
    startDay: 0,
    image: null,
    accentColor: '#000000',
    fontFamily: 'sans-serif',
    layout: 'bottom',
    isDefault: false,
    isAnalyzing: false,
  };

  const mockOnUpload = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnRegenerate = vi.fn();

  it('renders upload placeholder when no image is present', () => {
    render(
      <PhotoUploader
        data={mockMonthData}
        onUpload={mockOnUpload}
        onClear={mockOnClear}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('Click to Upload')).toBeInTheDocument();
  });

  it('renders image when image is present', () => {
    const dataWithImage = { ...mockMonthData, image: 'base64string' };
    render(
      <PhotoUploader
        data={dataWithImage}
        onUpload={mockOnUpload}
        onClear={mockOnClear}
        onRegenerate={mockOnRegenerate}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,base64string');
    expect(img).toHaveAttribute('alt', 'January');
  });

  it('renders default image with http url', () => {
    const dataWithImage = { ...mockMonthData, image: 'http://example.com/image.jpg', isDefault: true };
    render(
      <PhotoUploader
        data={dataWithImage}
        onUpload={mockOnUpload}
        onClear={mockOnClear}
        onRegenerate={mockOnRegenerate}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'http://example.com/image.jpg');
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('calls onUpload when file is selected', () => {
    render(
      <PhotoUploader
        data={mockMonthData}
        onUpload={mockOnUpload}
        onClear={mockOnClear}
        onRegenerate={mockOnRegenerate}
      />
    );

    // Mock click on input
    // Note: Since input is hidden, we might need to target it directly or trigger click on wrapper
    // The wrapper has onClick={handleClick} which triggers inputRef.current.click()

    // However, to test onUpload, we just need to fire change event on the input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnUpload).toHaveBeenCalledWith(file, 0);
  });

  it('calls onClear when remove button is clicked', () => {
    const dataWithImage = { ...mockMonthData, image: 'base64string' };
    render(
      <PhotoUploader
        data={dataWithImage}
        onUpload={mockOnUpload}
        onClear={mockOnClear}
        onRegenerate={mockOnRegenerate}
      />
    );

    // Button only appears on hover in CSS, but in DOM it is present
    const clearButton = screen.getByTitle('Remove Image');
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledWith(0);
  });

  it('calls onRegenerate when regenerate button is clicked', () => {
     const dataWithImage = { ...mockMonthData, image: 'base64string', isDefault: false };
    render(
      <PhotoUploader
        data={dataWithImage}
        onUpload={mockOnUpload}
        onClear={mockOnClear}
        onRegenerate={mockOnRegenerate}
      />
    );

    const regenerateButton = screen.getByTitle('Re-analyze Colors/Font');
    fireEvent.click(regenerateButton);

    expect(mockOnRegenerate).toHaveBeenCalledWith(0);
  });

  it('does not show regenerate button for default images', () => {
     const dataWithImage = { ...mockMonthData, image: 'http://example.com', isDefault: true };
    render(
      <PhotoUploader
        data={dataWithImage}
        onUpload={mockOnUpload}
        onClear={mockOnClear}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.queryByTitle('Re-analyze Colors/Font')).not.toBeInTheDocument();
  });

  it('shows upload button for default images', () => {
      const dataWithImage = { ...mockMonthData, image: 'http://example.com', isDefault: true };
      render(
        <PhotoUploader
          data={dataWithImage}
          onUpload={mockOnUpload}
          onClear={mockOnClear}
          onRegenerate={mockOnRegenerate}
        />
      );

      const uploadButton = screen.getByTitle('Upload Your Own');
      fireEvent.click(uploadButton);
      // We can't verify that the file input was clicked easily in JSDOM,
      // but we can verify the button is there and clickable.
      expect(uploadButton).toBeInTheDocument();
  });

  it('triggers file input click when clicking placeholder', () => {
      render(
        <PhotoUploader
          data={mockMonthData}
          onUpload={mockOnUpload}
          onClear={mockOnClear}
          onRegenerate={mockOnRegenerate}
        />
      );

      const placeholder = screen.getByText('Click to Upload').closest('div');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      fireEvent.click(placeholder!);
      expect(clickSpy).toHaveBeenCalled();
  });

  it('shows analyzing state', () => {
      const dataAnalyzing = { ...mockMonthData, isAnalyzing: true };
      render(
        <PhotoUploader
          data={dataAnalyzing}
          onUpload={mockOnUpload}
          onClear={mockOnClear}
          onRegenerate={mockOnRegenerate}
        />
      );

      // Look for the spinner or absence of upload icon
      expect(screen.queryByText('Click to Upload')).not.toBeInTheDocument();
      // We can find by class name logic or just knowing the structure
      // simpler to check if text is NOT there
  });
});
