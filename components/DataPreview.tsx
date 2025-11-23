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
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up max-w-4xl w-full mx-auto">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Preview</h2>
          <p className="text-sm text-slate-500">Reviewing source: <span className="font-mono text-indigo-600">{fileName}</span></p>
        </div>
        <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
          {data.length.toLocaleString()} total rows
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/50">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col} 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <Table className="w-3 h-3" />
                    {col}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {previewData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col) => (
                  <td key={`${idx}-${col}`} className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row[col] !== null ? String(row[col]) : <span className="text-slate-300 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
        <button 
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          Cancel & Select Different Source
        </button>
        <Button onClick={onConfirm} className="group">
          Start Analysis
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
};