/**
 * Compact status label or metadata chip.
 * Use for workout type tags, PR labels, consistency streaks, and filter tabs.
 */
export interface BadgeProps {
  /** Badge text content */
  children?: React.ReactNode;
  /** Visual style */
  variant?: 'neutral' | 'sage' | 'steel' | 'muted' | 'strong';
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Show a leading colored dot indicator */
  dot?: boolean;
}
