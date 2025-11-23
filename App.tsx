import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, Play, Terminal, RefreshCw, BarChart2, 
  Database, Download, Search, MessageSquare, ArrowRight, Layers, CheckCircle2,
  History, Clock, ChevronRight, ChevronDown, Table as TableIcon
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

interface HistoryItem {
  id: string;
  prompt: string;
  sql: string;
  timestamp: Date;
  result: QueryResult;
  status: 'success' | 'error';
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
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-switch tab based on results
  useEffect(() => {
    if (queryResult?.data && queryResult.data.length > 0) {
      setActiveTab('table');
      // Scroll to results when they appear
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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
    try {
      const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
      const file = new File([blob], 'cancer_research_data.csv', { type: 'text/csv' });
      
      parseCSV(file).then(parsedData => {
        setData(parsedData);
        setColumns(Object.keys(parsedData[0]));
        setFileName('cancer_research_data.csv');
        setState(ExtendedAppState.PREVIEW);
      }).catch(err => {
        console.error("Failed to parse sample data", err);
        alert("Error loading sample data.");
      });
    } catch (err) {
      console.error("Failed to create sample file", err);
      alert("Error initializing sample data.");
    }
  };

  const handleConnectAbstractDB = () => {
    if (window.confirm("Connect to Abstract DuckDB instance?")) {
      setConnectionType('duckdb');
      loadSampleData();
    }
  };

  const addToHistory = (promptText: string, sql: string, result: QueryResult, isSuccess: boolean) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      prompt: promptText || 'Manual SQL Query',
      sql: sql,
      timestamp: new Date(),
      result: result,
      status: isSuccess ? 'success' : 'error'
    };
    setHistory(prev => [newItem, ...prev]);
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
      await new Promise(r => setTimeout(r, 400)); 
      
      const validation = validateSQL(sql);
      
      if (!validation.valid) {
        setSqlStatus('invalid');
        const errorResult = { data: [], error: `SQL Syntax Error: ${validation.error}` };
        setQueryResult(errorResult);
        addToHistory(prompt, sql, errorResult, false);
        setIsGenerating(false);
        return;
      }
      
      setSqlStatus('valid');

      // 3. Execute
      const result = executeSQL(sql, data);
      setQueryResult(result);
      addToHistory(prompt, sql, result, !result.error);
    } catch (err: any) {
      const errorResult = { data: [], error: err.message };
      setQueryResult(errorResult);
      setSqlStatus('invalid');
      addToHistory(prompt, '', errorResult, false);
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
    addToHistory('Manual Query', generatedSql, result, !result.error);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setPrompt(item.prompt === 'Manual Query' ? '' : item.prompt);
    setGeneratedSql(item.sql);
    setQueryResult(item.result);
    setSqlStatus(item.status === 'success' ? 'valid' : 'invalid');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (item.result.data && item.result.data.length > 0) {
      setActiveTab('table');
    }
  };

  const resetApp = () => {
    setState(ExtendedAppState.UPLOAD);
    setData([]);
    setPrompt('');
    setGeneratedSql('');
    setQueryResult(null);
    setConnectionType(null);
    setSqlStatus('idle');
    setHistory([]);
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
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {state === ExtendedAppState.UPLOAD && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in-up max-w-7xl mx-auto">
            <div className="text-center mb-12 max-w-2xl">
              <h1 className="text-5xl font-bold text-stone-900 mb-6 tracking-tight leading-tight">
                Unlock Insights with <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600">Conversation</span>
              </h1>
              <p className="text-xl text-stone-500 leading-relaxed font-medium">
                Connect your data source and start asking questions in plain English. 
                Instant visualizations and answers, securely in your browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
              {/* CSV Upload Option */}
              <div 
                className="group relative bg-white p-10 rounded-3xl shadow-xl shadow-stone-200/50 border-2 border-transparent hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-100 transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1"
                onClick={() => {
                  setConnectionType('csv');
                  fileInputRef.current?.click();
                }}
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText className="w-32 h-32 text-orange-600" fill="currentColor" />
                </div>
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Upload className="w-8 h-8 text-orange-600" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3">Upload CSV File</h3>
                <p className="text-stone-500 text-base leading-relaxed">Parse and query standard CSV files instantly. Ideal for spreadsheets and exports.</p>
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
                className="group relative bg-white p-10 rounded-3xl shadow-xl shadow-stone-200/50 border-2 border-transparent hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-100 transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1"
                onClick={handleConnectAbstractDB}
              >
                 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Database className="w-32 h-32 text-amber-600" fill="currentColor" />
                </div>
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Layers className="w-8 h-8 text-amber-600" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3">Connect Abstract DB</h3>
                <p className="text-stone-500 text-base leading-relaxed">Connect to an in-memory database instance with sample cancer research data.</p>
              </div>
            </div>

            <div className="mt-10">
               <button onClick={loadSampleData} className="text-stone-400 hover:text-orange-600 text-sm font-semibold transition-colors flex items-center gap-2">
                 No data? <span className="underline decoration-2 decoration-stone-200 underline-offset-4 hover:decoration-orange-400">Load sample dataset</span>
               </button>
            </div>
          </div>
        )}

        {state === ExtendedAppState.PREVIEW && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-7xl mx-auto">
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
          <div className="w-full max-w-5xl mx-auto space-y-8 pb-24 animate-fade-in-up">
            
            {/* 1. Header Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl shadow-sm ${connectionType === 'duckdb' ? 'bg-amber-100' : 'bg-orange-100'}`}>
                  {connectionType === 'duckdb' ? <Database className="w-8 h-8 text-amber-700" fill="currentColor" strokeWidth={0} /> : <FileText className="w-8 h-8 text-orange-600" fill="currentColor" strokeWidth={0} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-800">{fileName}</h3>
                  <div className="flex items-center gap-3 text-sm text-stone-500 font-medium">
                     <span>{data.length.toLocaleString()} rows</span>
                     <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                     <span>{columns.length} columns</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" onClick={resetApp} className="text-stone-400 hover:text-rose-600">
                <RefreshCw className="w-5 h-5 mr-2" />
                Disconnect Source
              </Button>
            </div>

            {/* 2. Compose Section */}
            <section className="space-y-4">
               <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
                 </div>
                 Ask a Question
               </h2>
               <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
                 <div className="p-1">
                    <form onSubmit={handlePromptSubmit}>
                       <div className="relative">
                          <textarea
                             ref={inputRef}
                             className="w-full bg-white text-stone-800 placeholder-stone-400 text-lg p-6 min-h-[140px] focus:outline-none resize-y font-medium leading-relaxed"
                             placeholder="e.g., How many colorectal cases are there? or Show me therapy trends..."
                             value={prompt}
                             onChange={(e) => setPrompt(e.target.value)}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handlePromptSubmit(e);
                               }
                             }}
                          />
                          <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                             <div className="text-xs font-bold text-stone-400 uppercase tracking-wide flex items-center gap-2">
                                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">Enter</span> to run
                                <span className="px-2 py-1 bg-white border border-stone-200 rounded-md">Shift + Enter</span> new line
                             </div>
                             <button 
                               type="submit" 
                               disabled={isGenerating || !prompt.trim()}
                               className="bg-stone-900 text-white px-6 py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-orange-200 flex items-center gap-2 font-bold"
                             >
                               {isGenerating ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Analyzing...
                                  </>
                               ) : (
                                  <>
                                    Generate Analysis <ArrowRight className="w-4 h-4" />
                                  </>
                               )}
                             </button>
                          </div>
                       </div>
                    </form>
                 </div>
               </div>
            </section>

            {/* 3. SQL Console */}
            {(generatedSql || isGenerating) && (
              <section className="space-y-3">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                       <Terminal className="w-4 h-4" /> SQL Operation
                    </h3>
                    <div className="flex items-center gap-2">
                      {sqlStatus === 'checking' && <span className="text-xs text-amber-500 font-bold animate-pulse">Checking syntax...</span>}
                      {sqlStatus === 'valid' && <span className="text-xs text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid SQL</span>}
                      {sqlStatus === 'invalid' && <span className="text-xs text-rose-500 font-bold">Invalid syntax</span>}
                    </div>
                 </div>
                 <div className="bg-[#292524] rounded-2xl overflow-hidden shadow-md border border-stone-700">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#1c1917] border-b border-stone-800">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                      </div>
                      <button 
                        onClick={handleManualSqlRun}
                        disabled={!generatedSql || sqlStatus === 'checking'}
                        className="text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                      >
                        <Play className="w-3 h-3" fill="currentColor" /> Run Query
                      </button>
                    </div>
                    <div className="p-6 overflow-x-auto">
                       {isGenerating && !generatedSql ? (
                          <div className="flex items-center gap-2 text-stone-500 font-mono text-sm">
                             <span className="w-2 h-4 bg-orange-500 animate-pulse"></span>
                             Generating query...
                          </div>
                       ) : (
                          <code className={`font-mono text-sm leading-relaxed whitespace-pre-wrap ${sqlStatus === 'invalid' ? 'text-rose-400' : 'text-emerald-400'}`}>
                             {generatedSql}
                          </code>
                       )}
                    </div>
                 </div>
              </section>
            )}

            {/* 4. Results Area */}
            {queryResult && (
              <section ref={resultsRef} className="scroll-mt-28 space-y-4">
                 <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <BarChart2 className="w-5 h-5" strokeWidth={2.5} />
                   </div>
                   Results
                 </h2>
                 <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="border-b border-stone-100 p-4 bg-stone-50/50 flex flex-wrap gap-4 justify-between items-center">
                       <div className="flex p-1 bg-stone-200/50 rounded-xl">
                          <button 
                            onClick={() => setActiveTab('table')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'table' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                          >
                            <TableIcon className="w-4 h-4" strokeWidth={2.5} /> Data Table
                          </button>
                          <button 
                            onClick={() => setActiveTab('chart')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'chart' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                          >
                            <BarChart2 className="w-4 h-4" strokeWidth={2.5} /> Visualization
                          </button>
                       </div>
                       <div className="flex items-center gap-4">
                          {queryResult.executionTimeMs && (
                             <span className="text-xs font-mono text-stone-400 font-bold">
                                {queryResult.executionTimeMs.toFixed(2)}ms
                             </span>
                          )}
                          <Button variant="secondary" size="sm" onClick={downloadResults} className="gap-2">
                             <Download className="w-4 h-4" strokeWidth={2.5} /> Export
                          </Button>
                       </div>
                    </div>
                    
                    <div className="flex-grow bg-white relative">
                       {activeTab === 'table' ? (
                          <div className="absolute inset-0 overflow-auto custom-scrollbar">
                             <ResultsTable data={queryResult.data} error={queryResult.error} />
                          </div>
                       ) : (
                          <div className="absolute inset-0 p-6">
                             <Visualization data={queryResult.data} />
                          </div>
                       )}
                    </div>
                 </div>
              </section>
            )}

            {/* 5. Session History */}
            {history.length > 0 && (
               <section className="pt-16 border-t border-stone-200">
                  <h3 className="text-2xl font-bold text-stone-800 mb-8 flex items-center gap-3">
                     <History className="w-6 h-6 text-stone-400" />
                     Session History
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {history.map((item) => (
                        <div 
                           key={item.id}
                           onClick={() => loadHistoryItem(item)}
                           className="group bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 hover:border-orange-200 cursor-pointer transition-all duration-300"
                        >
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                                 <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                 <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-orange-600" strokeWidth={3} />
                              </div>
                           </div>
                           <p className="text-stone-800 font-bold leading-snug mb-3 group-hover:text-orange-800 transition-colors line-clamp-2">
                              {item.prompt}
                           </p>
                           <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 group-hover:bg-white group-hover:border-stone-200 transition-colors">
                              <code className="text-xs font-mono text-stone-500 line-clamp-1">
                                 {item.sql}
                              </code>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}