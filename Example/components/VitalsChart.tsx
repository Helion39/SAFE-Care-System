import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function VitalsChart({ vitals }) {
  if (!vitals || vitals.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No vital signs data available
      </div>
    );
  }

  // Prepare data for the chart (reverse chronological to show oldest first)
  const chartData = vitals
    .slice()
    .reverse()
    .map(vital => ({
      date: new Date(vital.timestamp).toLocaleDateString(),
      time: new Date(vital.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      systolic: vital.systolic_bp,
      diastolic: vital.diastolic_bp,
      heartRate: vital.heart_rate,
      timestamp: vital.timestamp
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{`${data.date} ${data.time}`}</p>
          <p style={{ color: '#dc2626' }}>
            <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#dc2626' }}></span>
            {`Systolic: ${data.systolic} mmHg`}
          </p>
          <p style={{ color: '#2c73b8' }}>
            <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#2c73b8' }}></span>
            {`Diastolic: ${data.diastolic} mmHg`}
          </p>
          <p style={{ color: '#6b7280' }}>
            <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#6b7280' }}></span>
            {`Heart Rate: ${data.heartRate} bpm`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time"
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="systolic" 
            stroke="#dc2626" 
            strokeWidth={2}
            name="Systolic BP (mmHg)"
            dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="diastolic" 
            stroke="#2c73b8" 
            strokeWidth={2}
            name="Diastolic BP (mmHg)"
            dot={{ fill: '#2c73b8', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="heartRate" 
            stroke="#6b7280" 
            strokeWidth={2}
            name="Heart Rate (bpm)"
            dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}