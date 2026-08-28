/**
 * Dark-themed text input for GymBro data entry.
 * Focus glow matches the accent palette (sage default, steel optional).
 * Supports label, hint, error, and prefix/suffix affixes.
 */
export interface InputProps {
  /** Mono uppercase label rendered above the field */
  label?: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** HTML input type */
  type?: 'text' | 'number' | 'email' | 'password' | 'search' | 'tel';
  /** Field height/font-size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Error message — replaces hint and colors border red */
  error?: string;
  /** Helper text shown below the field */
  hint?: string;
  /** Disable the field */
  disabled?: boolean;
  /** Content rendered before the input (e.g. unit label "KG") */
  prefix?: React.ReactNode;
  /** Content rendered after the input (e.g. unit or icon) */
  suffix?: React.ReactNode;
  /** Focus glow color — sage (green) or steel (blue) */
  focusColor?: 'sage' | 'steel';
  /** HTML id for label association */
  id?: string;
  /** HTML name for form submission */
  name?: string;
}
