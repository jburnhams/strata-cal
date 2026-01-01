import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { MonthData, FontStyle, TextPosition } from '../types';
import { generateMonthGrid } from '../services/dateService';
import { Upload, Palette, Type, ChevronDown } from 'lucide-react';

interface Props {
  year: number;
  monthData: MonthData[];
  onUpload?: (file: File, monthIndex: number) => void;
  onColorChange?: (color: string, monthIndex: number) => void;
  onTextPositionChange?: (x: number, y: number, monthIndex: number) => void;
  onFontStyleChange?: (style: FontStyle, monthIndex: number) => void;
  isInteractive?: boolean;
}

// Aspect Ratio for A4 Landscape is approx 1.414 (297mm / 210mm)
// We use a fixed width for the "PDF canvas" to ensure consistent font sizing
const A4_WIDTH_PX = 1123; // 96 DPI A4 Landscape width
const A4_HEIGHT_PX = 794; // 96 DPI A4 Landscape height

const getFontClass = (style: FontStyle) => {
  switch (style) {
    case FontStyle.Handwriting: return 'font-handwriting';
    case FontStyle.Display: return 'font-display';
    case FontStyle.Serif: return 'font-serif';
    default: return 'font-serif';
  }
};

const getTextPositionClasses = (position: TextPosition) => {
  switch (position) {
    case TextPosition.TopLeft: return 'top-16 left-16 text-left';
    case TextPosition.TopRight: return 'top-16 right-16 text-right';
    case TextPosition.BottomLeft: return 'bottom-16 left-16 text-left';
    case TextPosition.BottomRight: return 'bottom-16 right-16 text-right';
    default: return 'bottom-16 right-16 text-right';
  }
};

// --- Sub-component for Draggable Title ---
interface DraggableTitleProps {
  data: MonthData;
  isInteractive: boolean;
  onPositionChange?: (x: number, y: number, monthIndex: number) => void;
  onFontChange?: (style: FontStyle, monthIndex: number) => void;
}

const DraggableTitle: React.FC<DraggableTitleProps> = ({ data, isInteractive, onPositionChange, onFontChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
       if (elementRef.current && !elementRef.current.contains(e.target as Node)) {
          setIsMenuOpen(false);
       }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive || !onPositionChange) return;
    e.stopPropagation(); // Prevent bubbling to parent click handlers if any

    const element = elementRef.current;
    if (!element) return;
    
    // Find the container (A4 page)
    const container = element.offsetParent as HTMLElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    setIsDragging(false);
    
    // Calculate initial offset of mouse within the element
    const offsetX = e.clientX - elementRect.left;
    const offsetY = e.clientY - elementRect.top;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      // Store offset to maintain relative mouse position during drag
      initialLeft: offsetX,
      initialTop: offsetY,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;

      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;
      
      // If moved more than 5px, treat as drag
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        setIsDragging(true);
        setIsMenuOpen(false); // Close menu if dragging starts
      }

      // Calculate new position relative to container
      // Position = (MousePos - ContainerLeft - MouseOffsetInsideElement)
      let newLeftPx = moveEvent.clientX - containerRect.left - dragStartRef.current.initialLeft;
      let newTopPx = moveEvent.clientY - containerRect.top - dragStartRef.current.initialTop;

      // Constrain to container
      // newLeftPx = Math.max(0, Math.min(newLeftPx, containerRect.width - elementRect.width));
      // newTopPx = Math.max(0, Math.min(newTopPx, containerRect.height - elementRect.height));

      // Convert to percentage
      const newLeftPercent = (newLeftPx / containerRect.width) * 100;
      const newTopPercent = (newTopPx / containerRect.height) * 100;
      
      // Update parent immediately for smooth drag (could throttle this in production)
      onPositionChange(newLeftPercent, newTopPercent, data.monthIndex);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dragStartRef.current = null;
      
      // We rely on the `isDragging` state set during move to determine if it was a click or drag
      // Reset isDragging slightly later to allow onClick to check it? 
      // Actually handleMouseUp happens before Click.
      setTimeout(() => setIsDragging(false), 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && isInteractive) {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  // Styles
  const fontClass = getFontClass(data.fontStyle);
  const positionClass = getTextPositionClasses(data.textPosition);
  
  // Combine preset class positioning with custom coordinate positioning
  const style: React.CSSProperties = {
    color: data.accentColor,
    textShadow: '0 4px 30px rgba(0,0,0,0.3), 0 2px 10px rgba(0,0,0,0.2)',
    cursor: isInteractive ? 'move' : 'default',
    position: 'absolute', // Ensure absolute for coordinates
  };

  if (data.textPositionCoords) {
    style.left = `${data.textPositionCoords.x}%`;
    style.top = `${data.textPositionCoords.y}%`;
    // If we have custom coords, we override the preset placement classes.
    // However, we still might want text-alignment from the preset class if we don't handle it manually.
    // For simplicity, we just use the coordinates for Top-Left of the box.
  }

  return (
    <div 
      ref={elementRef}
      className={`${!data.textPositionCoords ? 'absolute ' + positionClass : ''} z-20 max-w-[70%] select-none`}
      style={style}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-html2canvas-ignore={isMenuOpen ? "true" : undefined} // Ignore logic for children? No, putting attribute on parent often ignores children too. We'll put ignore on the menu specifically.
    >
      <h1 className={`text-[120px] leading-none ${fontClass} drop-shadow-xl hover:opacity-90 transition-opacity`}>
        {data.name}
      </h1>
      
      {/* Font Selection Dropdown */}
      {isMenuOpen && isInteractive && onFontChange && (
        <div 
          className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px] flex flex-col gap-1 z-50 cursor-default"
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag start when clicking menu
          onClick={(e) => e.stopPropagation()}
          data-html2canvas-ignore="true"
        >
           <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">Select Font</div>
           
           <button 
             onClick={() => { onFontChange(FontStyle.Handwriting, data.monthIndex); setIsMenuOpen(false); }}
             className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${data.fontStyle === FontStyle.Handwriting ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
           >
             <span className="font-handwriting text-xl">Handwriting</span>
           </button>
           
           <button 
             onClick={() => { onFontChange(FontStyle.Display, data.monthIndex); setIsMenuOpen(false); }}
             className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${data.fontStyle === FontStyle.Display ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
           >
             <span className="font-display text-xl font-bold uppercase">Display</span>
           </button>
           
           <button 
             onClick={() => { onFontChange(FontStyle.Serif, data.monthIndex); setIsMenuOpen(false); }}
             className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${data.fontStyle === FontStyle.Serif ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
           >
             <span className="font-serif text-xl font-bold">Serif</span>
           </button>
        </div>
      )}
    </div>
  );
};

export const CalendarPreview = forwardRef<HTMLDivElement, Props>(({ year, monthData, onUpload, onColorChange, onTextPositionChange, onFontStyleChange, isInteractive = false }, ref) => {
  
  return (
    <div ref={ref} id="calendar-print-container">
      {monthData.map((data) => {
        const grid = generateMonthGrid(year, data.monthIndex);
        const fontClass = getFontClass(data.fontStyle);
        const imgSrc = data.image 
            ? (data.image.startsWith('http') ? data.image : `data:image/jpeg;base64,${data.image}`)
            : null;

        return (
          <React.Fragment key={data.monthIndex}>
            {/* PAGE 1: Photo Page (Full Bleed with Border) */}
            <div 
              className="relative overflow-hidden page-break-after-always bg-white mb-8 shadow-sm print:mb-0 print:shadow-none group/page box-border"
              style={{ 
                width: `${A4_WIDTH_PX}px`, 
                height: `${A4_HEIGHT_PX}px`,
                borderWidth: '24px',
                borderStyle: 'solid',
                borderColor: data.accentColor
              }}
            >
              <div className="relative w-full h-full overflow-hidden group/image-container">
                {imgSrc ? (
                  <img 
                    src={imgSrc} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    alt="Month Background"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">No Image</span>
                  </div>
                )}
                
                {/* Interactive Upload & Color Picker Overlay */}
                {isInteractive && (
                   <>
                     {/* Upload Area */}
                     {onUpload && (
                        <label className="absolute inset-0 cursor-pointer z-10 group/uploader">
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) onUpload(e.target.files[0], data.monthIndex);
                              }}
                              title="Change Photo"
                            />
                            {/* Hover effect for upload */}
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                <div className="opacity-0 group-hover/uploader:opacity-100 bg-white/90 text-gray-900 px-6 py-3 rounded-full shadow-xl transform translate-y-4 group-hover/uploader:translate-y-0 transition-all flex items-center gap-2 font-medium backdrop-blur-sm">
                                  <Upload size={18} />
                                  Change Photo
                                </div>
                            </div>
                        </label>
                     )}

                     {/* Color Picker Button - Independent of Upload */}
                     {onColorChange && (
                       <div 
                          className="absolute bottom-8 left-8 z-30 opacity-0 group-hover/page:opacity-100 transition-opacity"
                          data-html2canvas-ignore="true"
                        >
                          <label className="cursor-pointer group/palette flex items-center gap-2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:scale-105 transition-transform">
                            <input 
                              type="color" 
                              value={data.accentColor}
                              onChange={(e) => onColorChange(e.target.value, data.monthIndex)}
                              className="w-0 h-0 opacity-0 absolute"
                            />
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: data.accentColor }} 
                            />
                            <Palette size={20} className="text-gray-700" />
                            <span className="text-sm font-medium pr-2 text-gray-700 hidden group-hover/palette:inline-block">Change Color</span>
                          </label>
                       </div>
                     )}
                   </>
                )}

                {/* Draggable Month Name Title */}
                <DraggableTitle 
                  data={data}
                  isInteractive={isInteractive}
                  onPositionChange={onTextPositionChange}
                  onFontChange={onFontStyleChange}
                />
              </div>
            </div>

            {/* PAGE 2: Grid/Planner Page */}
            <div 
              className="relative bg-white p-12 flex flex-col page-break-after-always mb-8 shadow-sm print:mb-0 print:shadow-none"
              style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px` }}
            >
              {/* Header */}
              <div 
                className="flex justify-between items-end mb-8 border-b-4 pb-4" 
                style={{ borderColor: data.accentColor }}
              >
                 <h2 
                    className={`text-6xl ${fontClass}`} 
                    style={{ color: data.accentColor }}
                 >
                   {data.name}
                 </h2>
                 <span className="text-3xl text-gray-400 font-light">{year}</span>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="text-center font-bold text-gray-500 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 flex-grow border-l border-t border-gray-200">
                {grid.map((cell, idx) => (
                  <div 
                    key={idx} 
                    className={`
                      relative border-r border-b border-gray-200 p-2 h-full flex flex-col justify-between
                      ${!cell.isCurrentMonth ? 'bg-gray-50 text-gray-300' : 'text-gray-800'}
                    `}
                  >
                    {/* Date Number */}
                    <span className={`text-xl font-semibold ${cell.isCurrentMonth ? '' : 'font-normal'}`}>
                      {cell.date.getDate()}
                    </span>

                    {/* Holidays */}
                    <div className="flex flex-col gap-1 mt-1 mb-1">
                      {cell.holidays.map((h, hIdx) => (
                        <span 
                          key={hIdx}
                          className={`text-[10px] px-1 pt-0 pb-2 rounded leading-tight line-clamp-2
                            ${h.type === 'public' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                          `}
                          style={h.type === 'christian' ? { backgroundColor: `${data.accentColor}33`, color: '#333' } : {}}
                        >
                          {h.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer / Notes Area */}
              <div className="mt-6 flex justify-between text-sm text-gray-400">
                 <div className="flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-200"></span> Public Holiday</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{backgroundColor: `${data.accentColor}33`}}></span> Christian Holiday</span>
                 </div>
              </div>

            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
});

CalendarPreview.displayName = 'CalendarPreview';