Small uppercase mono chip for labels, tags, and status indicators throughout GymBro.

```jsx
// Workout type
<Badge variant="neutral">Strength</Badge>

// Progress / completion
<Badge variant="sage" dot>On track</Badge>

// Data / analytics
<Badge variant="steel">↑18%</Badge>

// Muted metadata label (no bg)
<Badge variant="muted">vs last week</Badge>

// Strong (inverted, high contrast)
<Badge variant="strong">PR</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>
```

Variants: neutral · sage · steel · muted · strong
Sizes: sm · md · lg
Notable: dot prop adds a 5px circle indicator; always uppercase mono rendering.
