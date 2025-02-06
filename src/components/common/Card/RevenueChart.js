import React from 'react';
import { Card, CardContent } from '../Card/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './RevenueChart.css';

const RevenueChart = () => {
  const data = [
    { date: '1 Dec', current: 35000, previous: 32000 },
    { date: '5 Dec', current: 42000, previous: 38000 },
    { date: '10 Dec', current: 38000, previous: 35000 },
    { date: '15 Dec', current: 45000, previous: 40000 },
    { date: '20 Dec', current: 48000, previous: 43000 },
    { date: '25 Dec', current: 51000, previous: 45000 },
    { date: '30 Dec', current: 55360, previous: 48000 }
  ];

  return (
    <div className="chart-card">
      <div className="chart-header">
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `฿${value.toLocaleString()}`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="custom-tooltip">
                      <p className="tooltip-date">{label}</p>
                      <p className="tooltip-current">
                        Current: ฿{payload[0].value.toLocaleString()}
                      </p>
                      <p className="tooltip-previous">
                        Previous: ฿{payload[1].value.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="current" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="previous" 
              stroke="#94A3B8" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;