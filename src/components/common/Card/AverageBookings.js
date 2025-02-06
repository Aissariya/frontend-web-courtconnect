import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card';
import './AverageBookings.css';

const data = [
  { time: '08:00', bookings: 15 },
  { time: '10:00', bookings: 25 },
  { time: '12:00', bookings: 20 },
  { time: '14:00', bookings: 30 },
  { time: '16:00', bookings: 35 },
  { time: '18:00', bookings: 40 },
  { time: '20:00', bookings: 28 }
];

const AverageBookingsChart = () => {
  return (
    <Card className="average-bookings-card">
      <CardHeader className="chart-header">
      </CardHeader>
      <CardContent className="chart-content">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            className="bookings-chart"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              className="chart-grid"
            />
            <XAxis 
              dataKey="time" 
              tickLine={false}
              axisLine={false}
              className="x-axis"
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              className="y-axis"
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="custom-tooltip">
                      <p className="tooltip-time">{label}</p>
                      <p className="tooltip-value">
                        {payload[0].value} Bookings
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="bookings" 
              className="booking-bars"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AverageBookingsChart;