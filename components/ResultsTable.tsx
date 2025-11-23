import React from 'react';
import { DataRow } from '../types';

interface ResultsTableProps {
  data: DataRow[];
  error?: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ data, error }) => {
  if (error) {
    return (
      <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-2xl">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm text-rose-800">
              <span className="font-bold">Error executing query:</span> {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
        <p className="text-stone-500 font-medium">No results found or query returned empty set.</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-hidden shadow-lg shadow-stone-200/50 rounded-3xl border border-stone-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col} 
                  scope="col" 
                  className="py-4 pl-6 pr-3 text-left text-xs font-bold uppercase tracking-wider text-stone-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-orange-50/30 transition-colors">
                {columns.map((col) => (
                  <td 
                    key={`${rowIdx}-${col}`} 
                    className="whitespace-nowrap py-4 pl-6 pr-3 text-sm text-stone-700 font-medium"
                  >
                    {row[col] !== null ? String(row[col]) : <span className="text-stone-300 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-xs font-medium text-stone-400 uppercase tracking-wide">
        Showing {data.length} row(s)
      </div>
    </div>
  );
};