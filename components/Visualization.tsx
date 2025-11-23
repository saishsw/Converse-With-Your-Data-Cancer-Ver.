import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { DataRow } from '../types';
import { BarChart2, TrendingUp, PieChart as PieIcon, Activity, AlertCircle } from 'lucide-react';

interface VisualizationProps {
  data: DataRow[];
}

type ChartType = 'bar' | 'line' | 'area' | 'pie';

// Natural, earthy palette
const COLORS = [
  '#ea580c', // Orange 600
  '#d97706', // Amber 600
  '#e11d48', // Rose 600
  '#059669', // Emerald 600
  '#0891b2', // Cyan 600 (Darker)
  '#475569', // Slate 600
  '#8b5cf6', // Violet 500 (kept as accent, but warmer)
  '#db2777'  // Pink 600
];

export const Visualization: React.FC<VisualizationProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [dataKey, setDataKey] = useState<string>('');

  // Analyze data structure to determine valid visualizations
  const analysis = useMemo(() => {
    if (!data || data.length === 0) return { numeric: [], categorical: [], date: [] };
    
    // Check first 10 rows (or all if less) to determine type more robustly
    const sampleSize = Math.min(data.length, 10);
    const sampleRows = data.slice(0, sampleSize);
    const columns = Object.keys(data[0]);

    const numeric: string[] = [];
    const categorical: string[] = [];
    const date: string[] = [];

    columns.forEach(col => {
      let isNumeric = true;
      let isDate = false;
      let hasData = false;
      
      // Check first non-null value for date heuristic
      const firstVal = sampleRows.find(r => r[col] != null)?.[col];
      if (typeof firstVal === 'string' && !isNaN(Date.parse(firstVal)) && (col.toLowerCase().includes('date') || col.toLowerCase().includes('time') || firstVal.includes('-') || firstVal.includes('/'))) {
         isDate = true;
         isNumeric = false;
      } else {
         // Check strictly for numbers across sample
         for (const row of sampleRows) {
           const val = row[col];
           if (val === null || val === undefined || val === '') continue;
           hasData = true;
           if (typeof val !== 'number') {
             isNumeric = false;
             break;
           }
         }
      }

      if (hasData || firstVal !== undefined) {
        if (isNumeric) numeric.push(col);
        else if (isDate) date.push(col);
        else categorical.push(col);
      }
    });

    return { numeric, categorical, date };
  }, [data]);

  // Determine which charts are compatible
  const compatibleCharts = useMemo(() => {
    const charts: ChartType[] = [];
    if (analysis.numeric.length > 0) {
      charts.push('bar'); // Needs at least 1 numeric
      
      // Line and Area are best with Dates or at least some X axis
      if (analysis.date.length > 0 || analysis.categorical.length > 0 || analysis.numeric.length > 1) {
        charts.push('line');
        charts.push('area');
      }
      
      // Pie needs 1 numeric + 1 categorical for labels ideally
      if (analysis.categorical.length > 0) {
        charts.push('pie');
      }
    }
    return charts;
  }, [analysis]);

  // Sync state when data changes
  useEffect(() => {
    if (!data.length) return;

    const currentRow = data[0];
    
    // Default X Axis: Date -> Categorical -> First Key
    let newXAxis = xAxisKey;
    if (!xAxisKey || !(xAxisKey in currentRow)) {
      if (analysis.date.length > 0) newXAxis = analysis.date[0];
      else if (analysis.categorical.length > 0) newXAxis = analysis.categorical[0];
      else newXAxis = Object.keys(currentRow)[0];
      setXAxisKey(newXAxis);
    }

    // Default Data Key: First Numeric
    let newDataKey = dataKey;
    if (!dataKey || !(dataKey in currentRow) || !analysis.numeric.includes(dataKey)) {
      if (analysis.numeric.length > 0) newDataKey = analysis.numeric[0];
      else newDataKey = '';
      setDataKey(newDataKey);
    }

    // Default Chart Type: Keep existing if compatible, else switch
    if (!compatibleCharts.includes(chartType)) {
      setChartType(compatibleCharts[0] || 'bar');
    }
  }, [data, analysis, compatibleCharts]); // Depend on data changing

  if (!data.length || compatibleCharts.length === 0 || !dataKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-400 p-8 text-center bg-stone-50 rounded-xl">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" fill="currentColor" />
        <p className="font-bold text-lg text-stone-600">Unable to visualize this dataset</p>
        <p className="text-sm mt-2 text-stone-500">We need at least one numeric column to generate charts.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-stone-100 shadow-xl shadow-stone-200 rounded-2xl bg-opacity-95 backdrop-blur-sm z-50">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: payload[0].color }} />
            <p className="text-base font-bold text-stone-800">
              {payload[0].name}: <span className="text-orange-600 font-mono ml-1">{payload[0].value.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#78716c', fontWeight: 500}} />
            <YAxis stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#78716c', fontWeight: 500}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '24px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, color: '#57534e' }} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#ea580c" 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 8, stroke: '#fed7aa', strokeWidth: 4, fill: '#ea580c' }}
              animationDuration={1500}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#78716c', fontWeight: 500}} />
            <YAxis stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#78716c', fontWeight: 500}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '24px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, color: '#57534e' }} />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#ea580c"
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#ea580c' }}
              animationDuration={1500}
            />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={130}
              innerRadius={80}
              paddingAngle={4}
              dataKey={dataKey}
              nameKey={xAxisKey}
              animationDuration={1000}
              stroke="none"
              cornerRadius={6}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 600, color: '#57534e' }} />
          </PieChart>
        );
      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
            <XAxis dataKey={xAxisKey} stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#78716c', fontWeight: 500}} />
            <YAxis stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#78716c', fontWeight: 500}} />
            <Tooltip 
              cursor={{ fill: '#f5f5f4', opacity: 0.8 }}
              content={<CustomTooltip />}
            />
            <Legend wrapperStyle={{ paddingTop: '24px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, color: '#57534e' }} />
            <Bar 
              dataKey={dataKey} 
              fill="#ea580c" 
              radius={[8, 8, 4, 4]} 
              barSize={40}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill="#ea580c" className="hover:fill-orange-500 transition-colors" />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-wrap items-center gap-4 mb-6 p-1 z-10">
        <div className="bg-stone-100 p-1.5 rounded-2xl flex items-center shadow-inner">
          {compatibleCharts.includes('bar') && (
            <button 
              onClick={() => setChartType('bar')}
              className={`p-2.5 rounded-xl transition-all ${chartType === 'bar' ? 'bg-white text-orange-600 shadow-md shadow-stone-200' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'}`}
              title="Bar Chart"
            >
              <BarChart2 className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
          {compatibleCharts.includes('line') && (
            <button 
              onClick={() => setChartType('line')}
              className={`p-2.5 rounded-xl transition-all ${chartType === 'line' ? 'bg-white text-orange-600 shadow-md shadow-stone-200' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'}`}
              title="Line Chart"
            >
              <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
          {compatibleCharts.includes('area') && (
            <button 
              onClick={() => setChartType('area')}
              className={`p-2.5 rounded-xl transition-all ${chartType === 'area' ? 'bg-white text-orange-600 shadow-md shadow-stone-200' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'}`}
              title="Area Chart"
            >
              <Activity className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
          {compatibleCharts.includes('pie') && (
            <button 
              onClick={() => setChartType('pie')}
              className={`p-2.5 rounded-xl transition-all ${chartType === 'pie' ? 'bg-white text-orange-600 shadow-md shadow-stone-200' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'}`}
              title="Pie Chart"
            >
              <PieIcon className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">X-Axis</label>
            <div className="relative">
               <select 
                value={xAxisKey} 
                onChange={(e) => setXAxisKey(e.target.value)}
                className="text-sm bg-stone-50 border-stone-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 py-2 pl-4 pr-10 shadow-sm transition-shadow hover:shadow-md cursor-pointer appearance-none font-semibold text-stone-700"
              >
                {Object.keys(data[0] || {}).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Y-Axis</label>
             <div className="relative">
              <select 
                value={dataKey} 
                onChange={(e) => setDataKey(e.target.value)}
                className="text-sm bg-stone-50 border-stone-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 py-2 pl-4 pr-10 shadow-sm transition-shadow hover:shadow-md cursor-pointer appearance-none font-semibold text-stone-700"
              >
                {analysis.numeric.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-grow w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};