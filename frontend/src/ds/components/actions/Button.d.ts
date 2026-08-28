/**
 * Primary interactive control for GymBro actions.
 * Use `primary` for main CTAs, `secondary` for supporting actions, `ghost` for quiet actions.
 * `sage` and `steel` add accent color backgrounds for contextual emphasis.
 *
 * @startingPoint section="Components" subtitle="Button — all variants and sizes" viewport="700x260"
 */
export interface ButtonProps {
  /** Button label */
  children?: React.ReactNode;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'sage' | 'steel' | 'danger';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Disable interaction and reduce opacity */
  disabled?: boolean;
  /** Icon element placed beside the label */
  icon?: React.ReactNode;
  /** Which side the icon appears on */
  iconPosition?: 'left' | 'right';
  /** Stretch to fill parent container width */
  fullWidth?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** HTML button type attribute */
  type?: 'button' | 'submit' | 'reset';
}
