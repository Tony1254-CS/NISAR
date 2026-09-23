import React from 'react';

export function Loading() {
  return (
    <div style={{ backgroundColor: 'var(--map-bg)', height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>Loading radar passes...</div>
      <div className="hydrograph-skeleton"></div>
    </div>
  );
}
