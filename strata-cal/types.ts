export enum FontStyle {
  Handwriting = 'handwriting',
  Serif = 'serif', // Playfair Display (Fancy)
  Display = 'display', // Oswald (Strong)
}

export enum TextPosition {
  TopLeft = 'top_left',
  TopRight = 'top_right',
  BottomLeft = 'bottom_left',
  BottomRight = 'bottom_right',
}

export interface MonthData {
  monthIndex: number; // 0-11
  name: string;
  image: string | null; // Base64 or URL
  accentColor: string; // Used for Border, Text, and Graphics
  textPosition: TextPosition;
  textPositionCoords?: { x: number; y: number } | null; // Custom coordinates in percentage (0-100)
  fontStyle: FontStyle;
  isAnalyzing: boolean;
  isDefault?: boolean;
}

export interface CalendarYear {
  year: number;
}

export interface Holiday {
  date: Date;
  name: string;
  type: 'public' | 'christian';
}

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  holidays: Holiday[];
}