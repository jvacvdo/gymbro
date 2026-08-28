import React, { useState } from 'react';

/**
 * Dark-themed text input for GymBro forms.
 * Supports label, placeholder, error state, prefix/suffix content,
 * and focus glow matching the accent palette.
 */
export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  size = 'md',
  error,
  hint,
  disabled = false,
  prefix,
  suffix,
  focusColor = 'sage',
  id,
  name,
}) {
  const [focused, setFocused] = useState(false);

  const sizes = {
    sm: { height: '36px', fontSize: '13px', padding: '0 12px' },
    md: { height: '44px', fontSize: '14px', padding: '0 16px' },
    lg: { height: '52px', fontSize: '15px', padding: '0 18px' },
  };

  const s = sizes[size] || sizes.md;

  const borderColor =
    error    ? 'rgba(255,107,107,0.6)' :
    focused  ? (focusColor === 'steel' ? 'rgba(138,162,192,0.5)' : 'rgba(159,216,154,0.4)') :
               'var(--border-default)';

  const glowShadow =
    focused && !error
      ? (focusColor === 'steel' ? 'var(--glow-steel-xs)' : 'var(--glow-sage-xs)')
      : 'none';

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  };

  const labelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: focused ? 'var(--text-secondary)' : 'var(--text-muted)',
    letterSpacing: 'var(--tracking-widest)',
    textTransform: 'uppercase',
    transition: 'color 150ms ease',
  };

  const inputWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--bg-input)',
    border: `1px solid ${borderColor}`,
    borderRadius: 'var(--radius-md)',
    boxShadow: glowShadow,
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    opacity: disabled ? 0.40 : 1,
    padding: s.padding,
    height: s.height,
    boxSizing: 'border-box',
  };

  const inputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 'var(--fw-regular)',
    fontSize: s.fontSize,
    lineHeight: 1,
    padding: 0,
    margin: 0,
    width: '100%',
  };

  const affixStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    flexShrink: 0,
    userSelect: 'none',
  };

  const errorStyle = {
    fontFamily: 'var(--font-ui)',
    fontSize: '12px',
    color: '#FF6B6B',
    lineHeight: 1.4,
  };

  const hintStyle = {
    fontFamily: 'var(--font-ui)',
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label htmlFor={id} style={labelStyle}>{label}</label>
      )}
      <div style={inputWrapperStyle}>
        {prefix && <span style={affixStyle}>{prefix}</span>}
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix && <span style={affixStyle}>{suffix}</span>}
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      {hint && !error && <div style={hintStyle}>{hint}</div>}
    </div>
  );
}
