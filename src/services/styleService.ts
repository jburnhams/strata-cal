import { FontStyle, TextPosition } from "../types";

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const PALETTE = [
  '#1e40af', // Blue
  '#be123c', // Pink/Red
  '#15803d', // Green
  '#a21caf', // Purple
  '#047857', // Emerald
  '#ca8a04', // Yellow/Gold
  '#c2410c', // Orange
  '#b91c1c', // Red
  '#854d0e', // Brown
  '#ea580c', // Orange
  '#374151', // Grey
  '#1d4ed8', // Blue
  '#4338ca', // Indigo
  '#be185d', // Pink
  '#0f172a', // Slate
  '#7c3aed', // Violet
];

export const analyzeImageStyle = async (base64Image: string): Promise<{ accentColor: string; textPosition: TextPosition; fontStyle: FontStyle }> => {
  // Simulate a small delay for better UX
  await new Promise(resolve => setTimeout(resolve, 600));

  const randomColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  
  const fontStyles = [FontStyle.Handwriting, FontStyle.Serif, FontStyle.Display];
  const randomFont = fontStyles[Math.floor(Math.random() * fontStyles.length)];

  const textPositions = [
    TextPosition.TopLeft, 
    TextPosition.TopRight, 
    TextPosition.BottomLeft, 
    TextPosition.BottomRight
  ];
  const randomPosition = textPositions[Math.floor(Math.random() * textPositions.length)];

  return {
    accentColor: randomColor,
    fontStyle: randomFont,
    textPosition: randomPosition
  };
};
