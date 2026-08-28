/**
 * Single-metric display block for workout summaries and analytics rows.
 * Renders label · large value · unit with optional trend indicator.
 */
export interface StatCardProps {
  /** Uppercase mono label above the value (e.g. "CALORIES") */
  label?: string;
  /** The primary metric value (e.g. "612" or "72") */
  value: string | number;
  /** Lowercase unit below value (e.g. "KCAL", "MIN", "/6") */
  unit?: string;
  /** Trend direction for the value */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend magnitude string (e.g. "18%") */
  trendValue?: string;
  /** Controls font size of all text within */
  size?: 'sm' | 'md' | 'lg';
}
