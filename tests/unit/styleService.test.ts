
import { analyzeImageStyle, fileToBase64 } from '@/src/services/styleService';
import { FontStyle, TextPosition } from '@/src/types';

describe('styleService', () => {
  describe('fileToBase64', () => {
    it('should convert a file to base64 string', async () => {
      // Mock FileReader
      const mockResult = 'data:image/jpeg;base64,VGhpcyBpcyBhIHRlc3Q=';
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Override global FileReader
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsDataURL(_: Blob) {
            // @ts-ignore
            this.result = mockResult;
            // @ts-ignore
            this.onload();
        }
      } as any;

      const result = await fileToBase64(mockFile);
      expect(result).toBe('VGhpcyBpcyBhIHRlc3Q=');

      // Restore
      global.FileReader = originalFileReader;
    });
  });

  describe('analyzeImageStyle', () => {
    it('should return a random style configuration', async () => {
      // Mock Random
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await analyzeImageStyle('base64data');

      expect(result).toHaveProperty('accentColor');
      expect(result).toHaveProperty('fontStyle');
      expect(result).toHaveProperty('textPosition');

      expect(Object.values(FontStyle)).toContain(result.fontStyle);
      expect(Object.values(TextPosition)).toContain(result.textPosition);

      vi.restoreAllMocks();
    });
  });
});
