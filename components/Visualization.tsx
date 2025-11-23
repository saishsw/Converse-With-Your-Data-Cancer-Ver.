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

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

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

    // Set default keys if current ones are invalid or empty
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
    // Verify dataKey is still a valid numeric column
    if (!dataKey || !(dataKey in currentRow) || !analysis.numeric.includes(dataKey)) {
      if (analysis.numeric.length > 0) newDataKey = analysis.numeric[0];
      else newDataKey = ''; // No numeric data to chart
      setDataKey(newDataKey);
    }

    // Default Chart Type
    if (!compatibleCharts.includes(chartType)) {
      setChartType(compatibleCharts[0] || 'bar');
    }
  }, [data, analysis, compatibleCharts]);

  if (!data.length || compatibleCharts.length === 0 || !dataKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
        <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
        <p className="font-medium">Unable to visualize this dataset</p>
        <p className="text-sm mt-1">We need at least one numeric column to generate charts.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg bg-opacity-95 backdrop-blur-sm z-50">
          <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
            <p className="text-sm font-bold text-slate-800">
              {payload[0].name}: <span className="text-indigo-600">{payload[0].value.toLocaleString()}</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#4f46e5" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} 
              activeDot={{ r: 8, stroke: '#c7d2fe', strokeWidth: 4 }}
              animationDuration={1500}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#4f46e5" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
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
              outerRadius={120}
              innerRadius={60}
              paddingAngle={2}
              dataKey={dataKey}
              nameKey={xAxisKey}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="vertical" align="right" verticalAlign="middle" />
          </PieChart>
        );
      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9', opacity: 0.6 }}
              content={<CustomTooltip />}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar 
              dataKey={dataKey} 
              fill="#4f46e5" 
              radius={[6, 6, 0, 0]} 
              barSize={40}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill="#4f46e5" className="hover:fill-indigo-500 transition-colors" />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-wrap items-center gap-4 mb-6 p-1 bg-white sticky top-0 z-10">
        <div className="bg-slate-100 p-1 rounded-lg flex items-center">
          {compatibleCharts.includes('bar') && (
            <button 
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-md transition-all ${chartType === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
              title="Bar Chart"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
          )}
          {compatibleCharts.includes('line') && (
            <button 
              onClick={() => setChartType('line')}
              className={`p-2 rounded-md transition-all ${chartType === 'line' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
              title="Line Chart"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
          )}
          {compatibleCharts.includes('area') && (
            <button 
              onClick={() => setChartType('area')}
              className={`p-2 rounded-md transition-all ${chartType === 'area' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
              title="Area Chart"
            >
              <Activity className="w-5 h-5" />
            </button>
          )}
          {compatibleCharts.includes('pie') && (
            <button 
              onClick={() => setChartType('pie')}
              className={`p-2 rounded-md transition-all ${chartType === 'pie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
              title="Pie Chart"
            >
              <PieIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">X-Axis</label>
          <select 
            value={xAxisKey} 
            onChange={(e) => setXAxisKey(e.target.value)}
            className="text-sm bg-slate-50 border-slate-200 rounded-md focus:border-indigo-500 focus:ring-indigo-500 py-1.5 pl-3 pr-8 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
          >
            {Object.keys(data[0] || {}).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Y-Axis</label>
          <select 
            value={dataKey} 
            onChange={(e) => setDataKey(e.target.value)}
            className="text-sm bg-slate-50 border-slate-200 rounded-md focus:border-indigo-500 focus:ring-indigo-500 py-1.5 pl-3 pr-8 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
          >
             {analysis.numeric.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-grow w-full min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};