
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/src/App';
import * as styleService from '@/src/services/styleService';
import { FontStyle, TextPosition } from '@/src/types';

// Mock styleService
vi.mock('@/src/services/styleService', () => ({
  analyzeImageStyle: vi.fn(),
  fileToBase64: vi.fn(),
}));

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    (styleService.analyzeImageStyle as any).mockResolvedValue({
      accentColor: '#000000',
      textPosition: TextPosition.BottomRight,
      fontStyle: FontStyle.Display
    });
    (styleService.fileToBase64 as any).mockResolvedValue('base64string');

    // Mock URL.createObjectURL and confirm
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.confirm = vi.fn(() => true);
    global.alert = vi.fn();
  });

  it('renders the header and initial state', () => {
    render(<App />);
    expect(screen.getAllByText('Strata Cal')).toHaveLength(2); // Mobile and Desktop
    expect(screen.getByText(/Design your \d+ year/)).toBeInTheDocument();

    // Should show 12 months
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    monthNames.forEach(name => {
        // We expect at least one, but since there's a hidden PDF preview, there might be 2.
        expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('allows switching view modes', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially thumbnail view
    expect(screen.getByText('Drag and drop to reorder images')).toBeInTheDocument();

    // Switch to Full view (desktop button)
    const fullBtn = screen.getByText('Full').closest('button');
    await user.click(fullBtn!);

    expect(screen.getByText('Full View Mode - Hover over images to change them')).toBeInTheDocument();
  });

  it('updates year', async () => {
    const user = userEvent.setup();
    render(<App />);

    const yearInput = screen.getByDisplayValue(String(new Date().getFullYear() + 1));

    // Select all text and type over it instead of clearing (which might trigger NaN/invalid state transiently)
    yearInput.focus();
    await user.type(yearInput, '{selectall}2026');

    expect(screen.getByText('Design your 2026 year')).toBeInTheDocument();
  });
});
