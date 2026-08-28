import React, { useState } from 'react';

/**
 * Dark surface container. GymBro's fundamental layout primitive —
 * wraps all list rows, metric blocks, and info sections.
 */
export function Card({
  children,
  variant = 'default',
  glow = null,
  padding = 'md',
  radius = 'md',
  clickable = false,
  onClick,
  style: styleProp,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isInteractive = clickable || !!onClick;

  const paddings = {
    none: '0',
    xs: 'var(--space-2)',
    sm: 'var(--space-3)',
    md: 'var(--space-4)',
    lg: 'var(--space-5)',
    xl: 'var(--space-6)',
  };

  const radii = {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
  };

  const backgrounds = {
    default: 'var(--bg-card)',
    elevated: 'var(--bg-elevated)',
    transparent: 'transparent',
    base: 'var(--bg-primary)',
  };

  const glowShadow =
    glow === 'sage'  ? 'var(--glow-sage)'  :
    glow === 'steel' ? 'var(--glow-steel)' : 'none';

  const style = {
    background: backgrounds[variant] || backgrounds.default,
    borderRadius: radii[radius] || radii.md,
    border: '1px solid var(--border-subtle)',
    padding: paddings[padding] || paddings.md,
    boxShadow: glowShadow,
    cursor: isInteractive ? 'pointer' : 'default',
    transition: 'background 180ms ease, box-shadow 180ms ease, transform 100ms ease',
    transform: pressed && isInteractive ? 'scale(0.99)' : 'scale(1)',
    ...(isInteractive && hovered && { background: backgrounds[variant] === 'var(--bg-card)' ? '#1E1E22' : backgrounds[variant] }),
    ...styleProp,
  };

  return (
    <div
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => isInteractive && setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {children}
    </div>
  );
}
