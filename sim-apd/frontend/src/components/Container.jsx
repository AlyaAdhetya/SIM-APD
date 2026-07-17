import React from 'react';
import './Container.css';

/**
 * Simple wrapper that centers content and limits max width.
 * Uses CSS Grid to keep children responsive.
 */
export default function Container({ children }) {
  return <div className="container-responsive">{children}</div>;
}
