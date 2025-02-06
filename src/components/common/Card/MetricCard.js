import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { Card, CardContent } from '../Card/Card';
import './MetricCard.css';

const MetricCard = ({ title, value, change, lastPeriod = 'vs last month' }) => {
  const isPositive = change >= 0;

  return (
    <Card className="metric-card">
      <CardContent className="metric-content">
        <div className="metric-container">
          <div className="metric-header">
            <span className="metric-title">{title}</span>
            <div className={`change-indicator ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? (
                <ArrowUpIcon className="change-icon" />
              ) : (
                <ArrowDownIcon className="change-icon" />
              )}
              <span className="change-value">{Math.abs(change)}%</span>
            </div>
          </div>
          
          <div className="metric-details">
            <span className="metric-value">{value}</span>
            <span className="metric-period">{lastPeriod}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;