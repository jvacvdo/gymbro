Dark-mode text input with sage focus glow. Core form primitive across GymBro.

```jsx
// Standard weight entry
<Input
  label="Weight"
  placeholder="0"
  type="number"
  suffix="KG"
  focusColor="sage"
/>

// With error
<Input
  label="Reps"
  value={reps}
  onChange={(e) => setReps(e.target.value)}
  error="Must be at least 1 rep."
/>

// With hint
<Input
  label="Rest timer"
  placeholder="90"
  suffix="SEC"
  hint="Recommended: 90–120 seconds for compound lifts."
/>

// Sizes
<Input size="sm" placeholder="Quick note…" />
<Input size="lg" label="Exercise name" placeholder="Bench Press" />
```

Props: label · placeholder · value · onChange · type · size (sm|md|lg) · error · hint · disabled
       prefix · suffix · focusColor (sage|steel) · id · name
Notable: sage glow on focus by default; error overrides hint and colors border red.
