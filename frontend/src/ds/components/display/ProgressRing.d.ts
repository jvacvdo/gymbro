/**
 * GymBro's signature circular progress arc.
 * 270° arc with gap at bottom, animated fill on mount, accent glow at tip.
 * Used for volume, consistency, calories, and all key metrics.
 */
export interface ProgressRingProps {
  /** Diameter in pixels */
  size?: number;
  /** Fill ratio from 0 to 1 */
  progress?: number;
  /** Center large value (e.g. "12,540" or "72%") */
  value?: string | number;
  /** Upper label line (e.g. "KG") */
  label?: string;
  /** Lower label line (e.g. "WEEKLY") */
  sublabel?: string;
  /** Accent color — sage (green) or steel (blue) */
  color?: 'sage' | 'steel' | 'none';
  /** Arc stroke thickness in pixels */
  strokeWidth?: number;
  /** Animate fill from 0 to progress on mount */
  animated?: boolean;
}
