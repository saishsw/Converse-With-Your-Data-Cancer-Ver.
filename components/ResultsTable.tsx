import React from 'react';
import { DataRow } from '../types';

interface ResultsTableProps {
  data: DataRow[];
  error?: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ data, error }) => {
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <span className="font-medium">Error executing query:</span> {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500">No results found or query returned empty set.</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-300">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col} 
                  scope="col" 
                  className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:pl-6"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td 
                    key={`${rowIdx}-${col}`} 
                    className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-slate-700 sm:pl-6"
                  >
                    {row[col] !== null ? String(row[col]) : <span className="text-slate-400 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
        Showing {data.length} row(s)
      </div>
    </div>
  );
};