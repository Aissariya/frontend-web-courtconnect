import React from 'react';
import MetricCard from '../../../components/common/Card/MetricCard';
import './MetricsGrid.css';

const MetricsGrid = ({ metrics, loading }) => {
  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={index === 0 && loading ? "Loading..." : metric.value}
          change={metric.change}
        />
      ))}
    </div>
  );
};

export default MetricsGrid;