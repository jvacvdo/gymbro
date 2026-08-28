import React, { useEffect, useRef, useState } from 'react';

/**
 * GymBro's signature circular progress indicator.
 * 270° arc with gap at bottom; animated fill on mount; glow at the arc tip.
 */
export function ProgressRing({
  size = 120,
  progress = 0.72,
  value,
  label,
  sublabel,
  color = 'sage',
  strokeWidth = 5,
  animated = true,
}) {
  const [displayed, setDisplayed] = useState(animated ? 0 : progress);

  useEffect(() => {
    if (!animated) { setDisplayed(progress); return; }
    let start = null;
    const duration = 1000;
    const from = 0;
    const to = Math.max(0, Math.min(1, progress));
    const ease = (t) => 1 - Math.pow(1 - t, 4); // ease-out-quart

    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(elapsed / duration, 1);
      setDisplayed(from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [progress, animated]);

  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const arcLen = 0.75 * C;           // 270° visible arc
  const dashOffset = -(0.375 * C);   // start at 7-8 o'clock; gap at bottom

  const accentColor = color === 'steel' ? '#8AA2C0' : color === 'none' ? 'var(--border-default)' : '#9FD89A';
  const trackColor = 'rgba(255,251,245,0.07)';
  const progressLen = displayed * arcLen;

  const glowFilter =
    color === 'sage'
      ? 'drop-shadow(0 0 5px #9FD89A) drop-shadow(0 0 12px rgba(159,216,154,0.45))'
      : color === 'steel'
      ? 'drop-shadow(0 0 5px #8AA2C0) drop-shadow(0 0 12px rgba(138,162,192,0.45))'
      : 'none';

  const fontSize = Math.round(size * 0.23);
  const labelSize = Math.round(size * 0.09);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLen} ${C}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        {progressLen > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progressLen} ${C}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ filter: glowFilter }}
          />
        )}
      </svg>
      {/* Center content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        pointerEvents: 'none',
      }}>
        {value !== undefined && (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--fw-bold)',
            fontSize: fontSize,
            color: 'var(--text-primary)',
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}>
            {value}
          </span>
        )}
        {label && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: labelSize,
            color: 'var(--text-muted)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: Math.round(labelSize * 0.85),
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
