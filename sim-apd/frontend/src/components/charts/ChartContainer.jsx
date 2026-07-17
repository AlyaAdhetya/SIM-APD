import React from 'react';
import './ChartContainer.css';

/**
 * Reusable container for charts. Applies glass‑morphism styling and margin.
 */
export default function ChartContainer({ title, children }) {
  return (
    <div className="chart-card">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-body">{children}</div>
    </div>
  );
}
