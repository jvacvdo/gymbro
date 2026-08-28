import React from 'react';

/**
 * Single-metric display block with label, value, and optional trend indicator.
 * Used in the three-stat row (Calories / Duration / Exercises) on the Home screen.
 */
export function StatCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  size = 'md',
}) {
  const sizes = {
    sm: { value: '22px', label: '9px', unit: '9px' },
    md: { value: '28px', label: '9px', unit: '9px' },
    lg: { value: '36px', label: '10px', unit: '10px' },
  };

  const s = sizes[size] || sizes.md;

  const trendColor = trend === 'up' ? 'var(--accent-progress)' : trend === 'down' ? '#FF6B6B' : 'var(--text-muted)';
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      minWidth: '60px',
    }}>
      {label && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: s.label,
          color: 'var(--text-muted)',
          letterSpacing: 'var(--tracking-widest)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {label}
        </span>
      )}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 'var(--fw-bold)',
        fontSize: s.value,
        color: 'var(--text-primary)',
        lineHeight: 1,
        letterSpacing: '-0.01em',
      }}>
        {value}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        {unit && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: s.unit,
            color: 'var(--text-muted)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            {unit}
          </span>
        )}
        {trend && trendValue && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: s.unit,
            color: trendColor,
            letterSpacing: '0.04em',
          }}>
            {trendSymbol}{trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
