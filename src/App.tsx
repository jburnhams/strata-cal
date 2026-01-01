import React, { useState, useRef, useLayoutEffect } from 'react';
import { Download, Calendar as CalendarIcon, Wand2, Upload, LayoutGrid, Maximize, Eye, ArrowLeftRight, Shuffle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { INITIAL_MONTHS_STATE, getHolidaysForYear } from './constants';
import { MonthData, FontStyle } from './types';
import { PhotoUploader } from './components/PhotoUploader';
import { CalendarPreview } from './components/CalendarPreview';
import { analyzeImageStyle, fileToBase64 } from './services/styleService';

// Helper component for auto-scaling modal content
interface AutoScaleModalProps {
  children?: React.ReactNode;
  onClose: () => void;
}

const AutoScaleModal = ({ children, onClose }: AutoScaleModalProps) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const calculateScale = () => {
      // Dimensions of the content (A4 Landscape x 2 + margin)
      // A4 Height = 794px. Two pages = 1588px. Plus spacing margin (32px).
      const contentHeight = 794 * 2 + 32;
      const contentWidth = 1123;

      const padding = 40; // 20px padding on each side of screen

      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - padding;

      const scaleX = availableWidth / contentWidth;
      const scaleY = availableHeight / contentHeight;

      // Use the smaller scale to ensure it fits entirely
      setScale(Math.min(scaleX, scaleY, 0.95)); // Max scale 0.95 to keep it looking like a preview
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
       <div
         ref={containerRef}
         className="origin-center transition-transform duration-200 ease-out pointer-events-none"
         style={{
           transform: `scale(${scale})`,
           width: '1123px', // Enforce the width so transform origin works correctly
           // height is automatic based on content, but scale applies to the block
         }}
       >
         {children}
       </div>
    </div>
  );
};

export default function App() {
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [months, setMonths] = useState<MonthData[]>(INITIAL_MONTHS_STATE);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [viewMode, setViewMode] = useState<'thumbnail' | 'full'>('thumbnail');
  const [previewMonthIndex, setPreviewMonthIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const isAnyAnalyzing = months.some(m => m.isAnalyzing);

  const handleUpload = async (file: File, monthIndex: number) => {
    // 1. Set Loading State
    setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? { ...m, isAnalyzing: true } : m));

    try {
      // 2. Convert to Base64
      const base64 = await fileToBase64(file);

      // 3. Analyze (Randomize)
      const analysis = await analyzeImageStyle(base64);

      // 4. Update State (Remove isDefault flag since user uploaded it)
      setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? {
        ...m,
        image: base64,
        isAnalyzing: false,
        accentColor: analysis.accentColor,
        textPosition: analysis.textPosition,
        fontStyle: analysis.fontStyle,
        isDefault: false
      } : m));

    } catch (err) {
      console.error(err);
      // Reset loading on error
      setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? { ...m, isAnalyzing: false } : m));
      alert("Failed to process image.");
    }
  };

  const handleBulkFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 12 files
    // Explicitly cast to File[] to avoid 'unknown' type inference issues with FileList in some TS environments
    const filesToProcess = Array.from(files).slice(0, 12) as File[];

    // 1. Set Loading State for all affected months first to give immediate feedback
    setMonths(prev => prev.map(m =>
      m.monthIndex < filesToProcess.length ? { ...m, isAnalyzing: true } : m
    ));

    // 2. Process concurrently
    filesToProcess.forEach(async (file, index) => {
      try {
        const base64 = await fileToBase64(file);
        // Analyze
        const analysis = await analyzeImageStyle(base64);

        setMonths(prev => prev.map(m => {
          if (m.monthIndex === index) {
            return {
              ...m,
              image: base64,
              isAnalyzing: false,
              accentColor: analysis.accentColor,
              textPosition: analysis.textPosition,
              fontStyle: analysis.fontStyle,
              isDefault: false
            };
          }
          return m;
        }));
      } catch (err) {
        console.error(`Error processing bulk file for month ${index}`, err);
         setMonths(prev => prev.map(m => m.monthIndex === index ? { ...m, isAnalyzing: false } : m));
      }
    });

    // Reset input to allow re-uploading the same files if needed
    if (bulkInputRef.current) bulkInputRef.current.value = '';
  };

  const handleClear = (monthIndex: number) => {
    // Reset to default state for that month
    setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? { ...INITIAL_MONTHS_STATE[monthIndex] } : m));
  };

  const handleRegenerateStyle = async (monthIndex: number) => {
    const month = months[monthIndex];
    if (!month.image || month.isDefault) return; // Don't regenerate for default URL images

    setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? { ...m, isAnalyzing: true } : m));

    try {
      const analysis = await analyzeImageStyle(month.image);
      setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? {
        ...m,
        isAnalyzing: false,
        accentColor: analysis.accentColor,
        textPosition: analysis.textPosition,
        fontStyle: analysis.fontStyle
      } : m));
    } catch (e) {
      setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? { ...m, isAnalyzing: false } : m));
    }
  };

  const handleColorChange = (newColor: string, monthIndex: number) => {
    setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? { ...m, accentColor: newColor } : m));
  };

  const handleTextPositionChange = (x: number, y: number, monthIndex: number) => {
     setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? { ...m, textPositionCoords: { x, y } } : m));
  };

  const handleFontStyleChange = (fontStyle: FontStyle, monthIndex: number) => {
    setMonths(prev => prev.map(m => m.monthIndex === monthIndex ? { ...m, fontStyle } : m));
  };

  const generatePdf = async () => {
    if (!printRef.current) return;

    // Check if all months have images (defaults are fine)
    const emptyMonths = months.filter(m => !m.image);
    if (emptyMonths.length > 0) {
      if(!confirm(`You have ${emptyMonths.length} months without images. Continue anyway?`)) return;
    }

    setIsGeneratingPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const container = printRef.current;
      const pages = Array.from(container.children) as HTMLElement[];

      for (let i = 0; i < pages.length; i++) {
        // Render page to canvas
        const canvas = await html2canvas(pages[i], {
          scale: 2, // Improve quality
          useCORS: true, // Critical for Picsum/external images
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const imgProps = pdf.getImageProperties(imgData);

        // A4 Landscape is 297x210
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        if (i < pages.length - 1) {
          pdf.addPage();
        }
      }

      pdf.save(`calendar-${year}.pdf`);

    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Check if CORS is blocked for the images.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isAnyAnalyzing) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // Optional: could clear dragOverIndex here but can be flickery
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === targetIndex) return;
    if (isAnyAnalyzing) return;

    setMonths(prev => {
       // Extract just the content (image, colors, styles)
       const contents = prev.map(m => {
          const { monthIndex, name, ...rest } = m;
          return rest;
       });

       // Reorder the array of contents
       const item = contents[draggedIndex];
       contents.splice(draggedIndex, 1);
       contents.splice(targetIndex, 0, item);

       // Merge back into the month structure
       return prev.map((m, i) => ({
         ...m,
         ...contents[i]
       }));
    });
    setDraggedIndex(null);
  };

  const handleReverse = () => {
    if (isAnyAnalyzing) return;

    if (confirm('Reverse the order of all images?')) {
        setMonths(prev => {
          const contents = prev.map(m => {
              const { monthIndex, name, ...rest } = m;
              return rest;
          });
          contents.reverse();
          return prev.map((m, i) => ({
            ...m,
            ...contents[i]
          }));
        });
    }
  };

  const handleRandomize = () => {
    if (isAnyAnalyzing) return;

    if (confirm('Randomize the order of all images?')) {
        setMonths(prev => {
          const contents = prev.map(m => {
              const { monthIndex, name, ...rest } = m;
              return rest;
          });

          // Fisher-Yates Shuffle
          for (let i = contents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [contents[i], contents[j]] = [contents[j], contents[i]];
          }

          return prev.map((m, i) => ({
            ...m,
            ...contents[i]
          }));
        });
    }
  };

  // Safe access for the modal preview month
  const selectedPreviewMonth = previewMonthIndex !== null ? months[previewMonthIndex] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Hidden Bulk Input */}
      <input
        type="file"
        multiple
        ref={bulkInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleBulkFiles}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Strata Cal</h1>
              <h1 className="text-xl font-bold text-gray-900 sm:hidden">Strata Cal</h1>
              <p className="text-xs text-gray-500">Design your {year} year</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 shadow-sm border border-gray-200">
                <span className="text-xs text-gray-500 mr-2 uppercase tracking-wide font-bold">Year</span>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setYear(0);
                      return;
                    }
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0 && val < 10000) setYear(val);
                  }}
                  onBlur={(e) => {
                     // Ensure valid year on blur if needed
                  }}
                  className="bg-transparent w-16 text-sm font-semibold outline-none"
                />
             </div>

             <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 h-10">
                <button
                  onClick={() => setViewMode('thumbnail')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'thumbnail' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <LayoutGrid size={16} />
                  <span>Thumbnail</span>
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'full' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Maximize size={16} />
                  <span>Full</span>
                </button>
             </div>

             {/* Mobile View Toggle */}
             <button
                onClick={() => setViewMode(viewMode === 'thumbnail' ? 'full' : 'thumbnail')}
                className="sm:hidden p-2 rounded-full bg-gray-100 text-gray-700"
             >
                {viewMode === 'thumbnail' ? <Maximize size={20} /> : <LayoutGrid size={20} />}
             </button>

             <button
                onClick={handleReverse}
                disabled={isAnyAnalyzing}
                className="flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reverse Image Order"
             >
                <ArrowLeftRight size={18} />
             </button>

             <button
                onClick={handleRandomize}
                disabled={isAnyAnalyzing}
                className="flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Randomize Image Order"
             >
                <Shuffle size={18} />
             </button>

             <button
                onClick={() => bulkInputRef.current?.click()}
                disabled={isAnyAnalyzing}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload up to 12 images at once (populates from January)"
             >
                <Upload size={18} />
                <span className="hidden lg:inline">Bulk Upload</span>
             </button>

             <button
              onClick={generatePdf}
              disabled={isGeneratingPdf || isAnyAnalyzing}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-lg transition-all
                ${(isGeneratingPdf || isAnyAnalyzing) ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-200'}
              `}
             >
               {isGeneratingPdf ? (
                 <>Generating...</>
               ) : (
                 <>
                   <Download size={18} />
                   <span className="hidden sm:inline">PDF</span>
                 </>
               )}
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">

          {viewMode === 'thumbnail' ? (
            <>
              <div className="mb-6 text-center max-w-2xl mx-auto">
                <span className="text-sm text-gray-400 block">Drag and drop to reorder images</span>
              </div>

              {/* Grid of Months */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {months.map((month) => (
                  <div
                    key={month.monthIndex}
                    draggable={!isAnyAnalyzing}
                    onDragStart={(e) => handleDragStart(e, month.monthIndex)}
                    onDragOver={(e) => handleDragOver(e, month.monthIndex)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, month.monthIndex)}
                    className={`
                      bg-white rounded-xl shadow-sm border p-4 transition-all relative
                      ${draggedIndex === month.monthIndex ? 'opacity-40 scale-95' : 'opacity-100 hover:shadow-md'}
                      ${dragOverIndex === month.monthIndex ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-100'}
                      ${!isAnyAnalyzing ? 'cursor-grab active:cursor-grabbing' : ''}
                    `}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-700 select-none pointer-events-none">{month.name}</h3>
                      <div className="flex items-center gap-2">
                        {month.image && (
                           <div className="flex gap-1 select-none pointer-events-none">
                              <div className="w-4 h-4 rounded-full border border-gray-200" style={{backgroundColor: month.accentColor}} title="Accent Color" />
                              <div className="w-4 h-4 rounded-full border border-gray-200 text-[10px] flex items-center justify-center font-bold" style={{backgroundColor: '#eee', color: '#333'}} title="Font Style">
                                 {month.fontStyle[0].toUpperCase()}
                              </div>
                           </div>
                        )}
                        <button
                          onClick={() => setPreviewMonthIndex(month.monthIndex)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Preview Month"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>

                    <div className={isAnyAnalyzing ? 'pointer-events-none opacity-80' : ''}>
                      <PhotoUploader
                        data={month}
                        onUpload={handleUpload}
                        onClear={handleClear}
                        onRegenerate={handleRegenerateStyle}
                      />
                    </div>

                    <div className="mt-3 text-xs text-gray-400 flex items-center justify-between select-none pointer-events-none">
                       <span>{getHolidaysForYear(year).filter(h => new Date(h.date).getMonth() === month.monthIndex).length} Holidays</span>
                       {month.isAnalyzing && <span className="text-blue-500 flex items-center gap-1"><Wand2 size={12}/> Styling...</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center w-full">
               <div className="mb-4 text-gray-500 text-sm flex items-center gap-2">
                  <Maximize size={16} />
                  <span>Full View Mode - Hover over images to change them</span>
               </div>
               <div className="w-full overflow-x-auto pb-10 flex justify-center">
                  {/* Scaled down preview to fit screen but high quality */}
                  <div className="origin-top scale-[0.35] sm:scale-[0.5] md:scale-[0.7] lg:scale-[0.8] xl:scale-[0.9] transition-transform">
                      <CalendarPreview
                        year={year}
                        monthData={months}
                        onUpload={handleUpload}
                        onColorChange={handleColorChange}
                        onTextPositionChange={handleTextPositionChange}
                        onFontStyleChange={handleFontStyleChange}
                        isInteractive={true}
                      />
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* Individual Month Preview Modal */}
      {selectedPreviewMonth && (
        <AutoScaleModal onClose={() => setPreviewMonthIndex(null)}>
            <CalendarPreview
              year={year}
              monthData={[selectedPreviewMonth]}
              onColorChange={handleColorChange}
              onTextPositionChange={handleTextPositionChange}
              onFontStyleChange={handleFontStyleChange}
              isInteractive={true}
            />
        </AutoScaleModal>
      )}

      {/*
         Hidden rendering area for PDF generation.
         We position it off-screen rather than display:none so html2canvas can capture it.
      */}
      <div className="fixed top-0 left-0 -z-50 pointer-events-none opacity-0" style={{ transform: 'translateX(-9999px)' }}>
          <CalendarPreview ref={printRef} year={year} monthData={months} isInteractive={false} />
      </div>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Strata Cal.</p>
      </footer>
    </div>
  );
}