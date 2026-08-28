import React from 'react';

/**
 * Small status/label chip. Renders inline metadata, workout types,
 * PR labels, and tab-style filters throughout the app.
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'var(--fw-regular)',
    letterSpacing: 'var(--tracking-wider)',
    textTransform: 'uppercase',
    borderRadius: 'var(--radius-xs)',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  };

  const sizes = {
    sm: { fontSize: '9px', padding: '3px 7px', gap: '4px' },
    md: { fontSize: '10px', padding: '4px 9px', gap: '5px' },
    lg: { fontSize: '11px', padding: '5px 11px', gap: '6px' },
  };

  const variants = {
    neutral: {
      background: 'rgba(255, 251, 245, 0.08)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)',
    },
    sage: {
      background: 'var(--accent-progress-faint)',
      color: 'var(--accent-progress)',
      border: '1px solid rgba(159,216,154,0.20)',
    },
    steel: {
      background: 'var(--accent-data-faint)',
      color: 'var(--accent-data)',
      border: '1px solid rgba(138,162,192,0.20)',
    },
    muted: {
      background: 'transparent',
      color: 'var(--text-muted)',
      border: 'none',
      letterSpacing: 'var(--tracking-widest)',
    },
    strong: {
      background: 'var(--color-off-white)',
      color: 'var(--color-off-black)',
      border: 'none',
    },
  };

  const dotColors = {
    neutral: 'var(--text-muted)',
    sage: 'var(--accent-progress)',
    steel: 'var(--accent-data)',
    muted: 'var(--text-muted)',
    strong: 'var(--color-off-black)',
  };

  const style = { ...base, ...sizes[size], ...variants[variant] };

  return (
    <span style={style}>
      {dot && (
        <span style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: dotColors[variant] || dotColors.neutral,
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}
