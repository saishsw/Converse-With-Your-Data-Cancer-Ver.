import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, Play, Terminal, RefreshCw, BarChart2, 
  Database, Download, Search, MessageSquare, ArrowRight, Layers, CheckCircle2
} from 'lucide-react';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { ResultsTable } from './components/ResultsTable';
import { DataPreview } from './components/DataPreview';
import { Visualization } from './components/Visualization';
import { parseCSV, executeSQL, downloadCSV, validateSQL, SAMPLE_CSV_CONTENT } from './services/dataService';
import { generateSQLFromPrompt } from './services/geminiService';
import { AppState, DataRow, QueryResult } from './types';

// Extended AppState
enum ExtendedAppState {
  UPLOAD = 'UPLOAD',
  PREVIEW = 'PREVIEW',
  ANALYSIS = 'ANALYSIS'
}

export default function App() {
  const [state, setState] = useState<ExtendedAppState>(ExtendedAppState.UPLOAD);
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  const [prompt, setPrompt] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sqlStatus, setSqlStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [connectionType, setConnectionType] = useState<'csv' | 'duckdb' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-switch tab based on results
  useEffect(() => {
    if (queryResult?.data && queryResult.data.length > 0) {
      setActiveTab('table');
    }
  }, [queryResult]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const parsedData = await parseCSV(file);
        setData(parsedData);
        setColumns(Object.keys(parsedData[0]));
        setFileName(file.name);
        setState(ExtendedAppState.PREVIEW);
      } catch (err) {
        alert('Error parsing CSV file');
        console.error(err);
      }
    }
  };

  const loadSampleData = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const file = new File([blob], 'sales_performance_2023.csv', { type: 'text/csv' });
    
    parseCSV(file).then(parsedData => {
      setData(parsedData);
      setColumns(Object.keys(parsedData[0]));
      setFileName('sales_performance_2023.csv');
      setState(ExtendedAppState.PREVIEW);
    });
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setQueryResult(null);
    setGeneratedSql('');
    setSqlStatus('idle');

    try {
      // 1. Generate SQL
      const sql = await generateSQLFromPrompt(prompt, columns, data[0]);
      setGeneratedSql(sql);
      
      // 2. Validate SQL
      setSqlStatus('checking');
      // Artificial small delay to show the status change for UX
      await new Promise(r => setTimeout(r, 400)); 
      
      const validation = validateSQL(sql);
      
      if (!validation.valid) {
        setSqlStatus('invalid');
        setQueryResult({ data: [], error: `SQL Syntax Error: ${validation.error}` });
        setIsGenerating(false);
        return;
      }
      
      setSqlStatus('valid');

      // 3. Execute
      const result = executeSQL(sql, data);
      setQueryResult(result);
    } catch (err: any) {
      setQueryResult({ data: [], error: err.message });
      setSqlStatus('invalid');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSqlRun = () => {
    if (!generatedSql.trim()) return;
    
    setSqlStatus('checking');
    const validation = validateSQL(generatedSql);
    
    if (!validation.valid) {
      setSqlStatus('invalid');
      setQueryResult({ data: [], error: `SQL Syntax Error: ${validation.error}` });
      return;
    }
    
    setSqlStatus('valid');
    const result = executeSQL(generatedSql, data);
    setQueryResult(result);
  };

  const resetApp = () => {
    setState(ExtendedAppState.UPLOAD);
    setData([]);
    setPrompt('');
    setGeneratedSql('');
    setQueryResult(null);
    setConnectionType(null);
    setSqlStatus('idle');
  };

  const confirmPreview = () => {
    setState(ExtendedAppState.ANALYSIS);
  };

  const downloadResults = () => {
    if (queryResult?.data) {
      downloadCSV(queryResult.data, `query_results_${Date.now()}.csv`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {state === ExtendedAppState.UPLOAD && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in-up">
            <div className="text-center mb-10 max-w-2xl">
              <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Unlock Insights with <span className="text-indigo-600">Conversation</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed">
                Connect your data source and start asking questions in plain English. 
                We instantly generate SQL, run queries, and visualize results securely in your browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
              {/* CSV Upload Option */}
              <div 
                className="group relative bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-indigo-100 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                onClick={() => {
                  setConnectionType('csv');
                  fileInputRef.current?.click();
                }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileText className="w-24 h-24 text-indigo-600" />
                </div>
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Upload CSV File</h3>
                <p className="text-slate-500 text-sm">Parse and query standard CSV files instantly. Ideal for spreadsheets and exports.</p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
              </div>

              {/* Abstract DuckDB Option */}
              <div 
                className="group relative bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-amber-100 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                onClick={() => {
                   setConnectionType('duckdb');
                   // For now, we simulate DuckDB connection by loading the sample data or prompting for a file
                   // In a real app, this would open a specific .db file picker or connection string dialog
                   if(confirm("For this demo, we will initialize an in-memory DuckDB instance with sample sales data. Continue?")) {
                     loadSampleData();
                   }
                }}
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Database className="w-24 h-24 text-amber-500" />
                </div>
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Layers className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Connect Abstract DB</h3>
                <p className="text-slate-500 text-sm">Connect to an in-memory DuckDB instance or SQLite abstraction for advanced querying.</p>
              </div>
            </div>

            <div className="mt-8">
               <button onClick={loadSampleData} className="text-slate-400 hover:text-indigo-600 text-sm font-medium transition-colors">
                 No data? Load sample sales dataset
               </button>
            </div>
          </div>
        )}

        {state === ExtendedAppState.PREVIEW && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <DataPreview 
              data={data} 
              columns={columns} 
              fileName={fileName} 
              onConfirm={confirmPreview}
              onCancel={resetApp}
            />
          </div>
        )}

        {state === ExtendedAppState.ANALYSIS && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)] animate-fade-in-up">
            
            {/* Sidebar / Left Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
              
              {/* File Info */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${connectionType === 'duckdb' ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                    {connectionType === 'duckdb' ? <Database className="w-5 h-5 text-amber-600" /> : <FileText className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-slate-900 truncate max-w-[180px]" title={fileName}>{fileName}</h3>
                    <p className="text-xs text-slate-500">{data.length.toLocaleString()} rows • {columns.length} columns</p>
                  </div>
                </div>
                <button onClick={resetApp} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Disconnect">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Prompt Input */}
              <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-1">
                <div className="p-4">
                  <label className="block text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    Ask a question
                  </label>
                  <form onSubmit={handlePromptSubmit}>
                    <div className="relative">
                      <textarea
                        className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none shadow-inner"
                        placeholder="e.g., Show me total sales by region and category for 2023..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePromptSubmit(e);
                          }
                        }}
                      />
                      <div className="absolute bottom-3 right-3">
                         <button 
                           type="submit" 
                           disabled={isGenerating || !prompt.trim()}
                           className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                         >
                           {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                         </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* SQL & Console */}
              <div className="flex-grow bg-slate-900 rounded-xl shadow-md overflow-hidden flex flex-col min-h-[200px]">
                <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-slate-300 font-medium">SQL Console</span>
                    {sqlStatus === 'checking' && <span className="text-[10px] text-amber-400 animate-pulse">Checking syntax...</span>}
                    {sqlStatus === 'valid' && <span className="flex items-center text-[10px] text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1"/> Valid</span>}
                  </div>
                  <button 
                    onClick={handleManualSqlRun}
                    disabled={!generatedSql || sqlStatus === 'checking'}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                  >
                    <Play className="w-3 h-3" /> Run
                  </button>
                </div>
                <div className="p-4 font-mono text-xs overflow-auto flex-grow custom-scrollbar">
                  {generatedSql ? (
                    <code className={`block whitespace-pre-wrap leading-relaxed ${sqlStatus === 'invalid' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {generatedSql}
                    </code>
                  ) : (
                    <span className="text-slate-600 italic">// Generated SQL queries will appear here...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content / Results */}
            <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               {/* Result Tabs */}
               <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setActiveTab('table')}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Data Table
                    </button>
                    <button 
                      onClick={() => setActiveTab('chart')}
                      disabled={!queryResult?.data?.length}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'chart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'}`}
                    >
                      <BarChart2 className="w-4 h-4" />
                      Visualizations
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                     {queryResult?.executionTimeMs && (
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                        Execution: {queryResult.executionTimeMs.toFixed(2)}ms
                      </span>
                    )}
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={downloadResults}
                      disabled={!queryResult?.data?.length}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                  </div>
               </div>

               {/* Result Content */}
               <div className="flex-grow overflow-auto bg-white p-0 relative">
                  {activeTab === 'table' ? (
                    <div className="h-full overflow-auto custom-scrollbar">
                      <ResultsTable data={queryResult?.data || []} error={queryResult?.error} />
                    </div>
                  ) : (
                     <div className="h-full p-6">
                        <Visualization data={queryResult?.data || []} />
                     </div>
                  )}

                  {!queryResult && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                       <Search className="w-16 h-16 mb-4 opacity-20" />
                       <p className="text-lg font-medium opacity-50">Ready to analyze</p>
                    </div>
                  )}
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
