import React, { useRef } from 'react';
import { Upload, X, RefreshCw } from 'lucide-react';
import { MonthData } from '../types';

interface Props {
  data: MonthData;
  onUpload: (file: File, monthIndex: number) => void;
  onClear: (monthIndex: number) => void;
  onRegenerate: (monthIndex: number) => void;
}

export const PhotoUploader: React.FC<Props> = ({ data, onUpload, onClear, onRegenerate }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], data.monthIndex);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  // Determine image source: Default uses URL directly, uploaded uses base64 prefix
  const imgSrc = data.image 
    ? (data.image.startsWith('http') ? data.image : `data:image/jpeg;base64,${data.image}`)
    : null;

  return (
    <div className="relative group w-full aspect-[1.414/1] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden hover:border-blue-400 transition-colors">
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {imgSrc ? (
        <>
          <img 
            src={imgSrc} 
            alt={data.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
              onClick={() => onClear(data.monthIndex)}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-105"
              title={data.isDefault ? "Clear Default Image" : "Remove Image"}
            >
              <X size={20} />
            </button>
            {/* Only allow regenerating styles for non-default images to avoid CORS issues with analysis */}
            {!data.isDefault && (
              <button 
                onClick={() => onRegenerate(data.monthIndex)}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-transform hover:scale-105"
                title="Re-analyze Colors/Font"
              >
                <RefreshCw size={20} className={data.isAnalyzing ? "animate-spin" : ""} />
              </button>
            )}
             {data.isDefault && (
               <button 
                onClick={handleClick}
                className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-transform hover:scale-105"
                title="Upload Your Own"
              >
                <Upload size={20} />
              </button>
             )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-medium flex justify-between items-end">
             <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-white" style={{backgroundColor: data.accentColor}}></span>
                {data.name}
             </span>
             {data.isDefault && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Default</span>}
          </div>
        </>
      ) : (
        <div 
          onClick={handleClick}
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-500 hover:text-blue-500"
        >
          {data.isAnalyzing ? (
             <div className="animate-spin text-blue-500"><RefreshCw size={32} /></div>
          ) : (
             <>
               <Upload size={32} className="mb-2" />
               <span className="text-sm font-medium">{data.name}</span>
               <span className="text-xs text-gray-400 mt-1">Click to Upload</span>
             </>
          )}
        </div>
      )}
    </div>
  );
};