import React from 'react';

export function SkeletonBlock({ height = 16, width = '100%', radius = 8, style }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-card" key={i}>
          <SkeletonBlock height={11} width="50%" style={{ marginBottom: 16 }} />
          <SkeletonBlock height={28} width="70%" style={{ marginBottom: 8 }} />
          <SkeletonBlock height={12} width="85%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanel({ height = 260 }) {
  return (
    <div className="panel">
      <SkeletonBlock height={14} width="35%" style={{ marginBottom: 20 }} />
      <SkeletonBlock height={height} radius={14} />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 5 }) {
  return (
    <table className="data-table">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((__, c) => (
              <td key={c}>
                <SkeletonBlock height={13} width={c === 0 ? '80%' : '60%'} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
