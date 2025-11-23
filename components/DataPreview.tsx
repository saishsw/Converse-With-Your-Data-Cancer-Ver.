import React from 'react';
import { DataRow } from '../types';
import { Button } from './Button';
import { ArrowRight, Table } from 'lucide-react';

interface DataPreviewProps {
  data: DataRow[];
  columns: string[];
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ 
  data, 
  columns, 
  fileName, 
  onConfirm, 
  onCancel 
}) => {
  // Preview only first 5 rows
  const previewData = data.slice(0, 5);

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-stone-200 border border-stone-100 overflow-hidden animate-fade-in-up max-w-4xl w-full mx-auto">
      <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Data Preview</h2>
          <p className="text-sm text-stone-500 mt-1">Reviewing source: <span className="font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{fileName}</span></p>
        </div>
        <div className="text-sm font-semibold text-stone-500 bg-white px-4 py-2 rounded-2xl border border-stone-200 shadow-sm">
          {data.length.toLocaleString()} total rows
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-100">
          <thead className="bg-stone-50">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col} 
                  className="px-8 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-stone-400" fill="currentColor" />
                    {col}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-100">
            {previewData.map((row, idx) => (
              <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                {columns.map((col) => (
                  <td key={`${idx}-${col}`} className="px-8 py-4 whitespace-nowrap text-sm text-stone-600 font-medium">
                    {row[col] !== null ? String(row[col]) : <span className="text-stone-300 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-stone-50 px-8 py-6 flex items-center justify-between border-t border-stone-200">
        <button 
          onClick={onCancel}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors font-bold"
        >
          Cancel & Select Different Source
        </button>
        <Button onClick={onConfirm} className="group shadow-lg shadow-orange-200/50">
          Start Analysis
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
        </Button>
      </div>
    </div>
  );
};