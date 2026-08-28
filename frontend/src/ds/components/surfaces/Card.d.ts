/**
 * Dark surface container — GymBro's primary layout primitive.
 * Wraps metrics, exercise rows, charts, and any other grouped content.
 * Supports glow variants for highlighted/active states.
 */
export interface CardProps {
  /** Card contents */
  children?: React.ReactNode;
  /** Surface depth */
  variant?: 'default' | 'elevated' | 'transparent' | 'base';
  /** Accent glow applied as box-shadow */
  glow?: 'sage' | 'steel' | null;
  /** Inner padding preset */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Corner radius preset */
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  /** Enable hover/press states for interactive cards */
  clickable?: boolean;
  /** Click handler (also enables interactive states) */
  onClick?: () => void;
  /** Additional inline styles merged last */
  style?: React.CSSProperties;
}
