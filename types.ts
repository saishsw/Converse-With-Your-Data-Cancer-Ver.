export interface DataRow {
  [key: string]: any;
}

export interface QueryResult {
  data: DataRow[];
  error?: string;
  executionTimeMs?: number;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  ANALYSIS = 'ANALYSIS',
}

// Declare global variables for libraries loaded via CDN
declare global {
  interface Window {
    Papa: any;
    alasql: any;
  }
}
