Dark surface container with subtle border — the foundational layout block in GymBro.

```jsx
// Standard metric block
<Card padding="md" radius="md">
  <StatCard label="Volume" value="12,540" unit="kg" />
</Card>

// Elevated (modals, dropdowns)
<Card variant="elevated" padding="lg" radius="lg">
  <p>Modal content here</p>
</Card>

// Sage glow — active/highlighted card
<Card glow="sage" padding="md">
  <ProgressRing size={80} progress={0.72} value="72%" color="sage" />
</Card>

// Interactive / tappable row
<Card clickable onClick={() => navigate('bench-press')} padding="md">
  <ExerciseRow name="Bench Press" sets="4×6–8" weight="100 kg" />
</Card>
```

Variants: default · elevated · transparent · base
Padding: none · xs · sm · md · lg · xl
Glow: sage · steel · null
Notable: clickable enables hover/press states with 0.99 scale; glow renders as box-shadow.
