import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './RevenuePieChart.css';

const RevenuePieChart = () => {
  const data = [
    { name: 'Alpha', value: 27680.00, percentage: 50.0, color: '#10B981' },
    { name: 'Beta', value: 16884.80, percentage: 30.5, color: '#FBBF24' },
    { name: 'Gamma', value: 10795.20, percentage: 19.5, color: '#F87171' }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percentage }) => {
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#6B7280"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="percentage-label"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="pie-chart-wrapper">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={160}
            dataKey="value"
            labelLine={false}
            label={renderCustomizedLabel}
            paddingAngle={0}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenuePieChart;