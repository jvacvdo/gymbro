import React, { useState } from 'react';

/**
 * GymBro primary interactive control. Supports 6 visual variants,
 * 3 sizes, icons on either side, full-width mode, and hover/press states.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  iconPosition = 'right',
  fullWidth = false,
  onClick,
  type = 'button',
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    fontFamily: 'var(--font-ui)',
    fontWeight: 'var(--fw-medium)',
    letterSpacing: 'var(--tracking-wide)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 100ms ease, opacity 100ms ease, box-shadow 180ms ease',
    transform: pressed && !disabled ? 'scale(0.96)' : 'scale(1)',
    border: 'none',
    outline: 'none',
    borderRadius: 'var(--radius-full)',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    width: fullWidth ? '100%' : 'auto',
    boxSizing: 'border-box',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const sizes = {
    sm: { height: '32px', padding: '0 14px', fontSize: '12px', gap: '5px' },
    md: { height: '42px', padding: '0 22px', fontSize: '13px' },
    lg: { height: '52px', padding: '0 30px', fontSize: '15px', gap: '8px' },
  };

  const getVariantStyle = () => {
    const isActive = !disabled;
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--color-off-white)',
          color: 'var(--color-off-black)',
          opacity: disabled ? 0.38 : hovered ? 0.88 : 1,
          boxShadow: isActive && hovered ? 'var(--shadow-sm)' : 'none',
        };
      case 'secondary':
        return {
          background: isActive && hovered ? 'rgba(255,251,245,0.06)' : 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          opacity: disabled ? 0.38 : 1,
        };
      case 'ghost':
        return {
          background: isActive && hovered ? 'rgba(255,251,245,0.06)' : 'transparent',
          color: 'var(--text-primary)',
          opacity: disabled ? 0.38 : 1,
        };
      case 'sage':
        return {
          background: 'var(--accent-progress)',
          color: 'var(--color-off-black)',
          opacity: disabled ? 0.38 : hovered ? 0.88 : 1,
          boxShadow: isActive && hovered ? 'var(--glow-sage-sm)' : 'none',
        };
      case 'steel':
        return {
          background: 'var(--accent-data)',
          color: 'var(--color-off-black)',
          opacity: disabled ? 0.38 : hovered ? 0.88 : 1,
          boxShadow: isActive && hovered ? 'var(--glow-steel-sm)' : 'none',
        };
      case 'danger':
        return {
          background: isActive && hovered ? 'rgba(255,107,107,0.08)' : 'transparent',
          color: '#FF6B6B',
          border: '1px solid rgba(255,107,107,0.25)',
          opacity: disabled ? 0.38 : 1,
        };
      default:
        return {};
    }
  };

  const style = {
    ...base,
    ...sizes[size],
    ...getVariantStyle(),
  };

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {icon && iconPosition === 'left' && (
        <span style={{ display: 'flex', alignItems: 'center', lineHeight: 0 }}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span style={{ display: 'flex', alignItems: 'center', lineHeight: 0 }}>{icon}</span>
      )}
    </button>
  );
}
