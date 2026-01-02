import React from 'react';

interface ProgressModalProps {
  progress: number;
  total: number;
  status: string;
}

export const ProgressModal = ({ progress, total, status }: ProgressModalProps) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Generating PDF</h3>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600">
           <span>{status}</span>
           <span>{percentage}%</span>
        </div>
      </div>
    </div>
  );
};
