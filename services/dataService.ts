import { DataRow, QueryResult } from '../types';

export const SAMPLE_CSV_CONTENT = `id,product,category,price,sales,date,region,profit
1,Laptop Pro,Electronics,1200,50,2023-01-15,North,15000
2,Wireless Mouse,Electronics,25,200,2023-01-16,South,2500
3,Coffee Maker,Home,85,30,2023-01-17,East,1200
4,Desk Chair,Furniture,250,20,2023-01-18,West,2000
5,Monitor 4K,Electronics,400,45,2023-01-19,North,6500
6,Blender,Home,50,60,2023-01-20,East,900
7,Standing Desk,Furniture,500,15,2023-01-21,West,3500
8,Headphones,Electronics,150,80,2023-01-22,South,4000
9,Toaster,Home,40,40,2023-01-23,North,600
10,Bookshelf,Furniture,120,25,2023-01-24,East,1200`;

export const parseCSV = (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    if (!window.Papa) {
      reject(new Error('PapaParse library not loaded'));
      return;
    }

    window.Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.data && results.data.length > 0) {
          resolve(results.data);
        } else {
          reject(new Error('No data found in CSV'));
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

export const validateSQL = (sql: string): { valid: boolean; error?: string } => {
  if (!window.alasql) {
    return { valid: true }; // Assume valid if engine not loaded yet (will fail at exec)
  }
  try {
    window.alasql.parse(sql);
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Syntax error' };
  }
};

export const executeSQL = (sql: string, data: DataRow[]): QueryResult => {
  if (!window.alasql) {
    return { data: [], error: 'AlaSQL library not loaded' };
  }

  const startTime = performance.now();
  try {
    // Create an in-memory database context for this execution
    // We register the data as a table named 'csv_data'
    // Note: alasql can query arrays directly via ? placeholder or standard param injection
    // To allow natural table naming "FROM csv_data", we can do:
    const res = window.alasql(sql, [data]);
    const endTime = performance.now();
    
    return {
      data: res,
      executionTimeMs: endTime - startTime
    };
  } catch (err: any) {
    return {
      data: [],
      error: err.message || 'Unknown SQL execution error'
    };
  }
};

export const downloadCSV = (data: DataRow[], filename: string) => {
  if (!window.Papa) return;
  
  const csv = window.Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
