Pill-shaped button with hover/press states; the primary CTA pattern in GymBro.

```jsx
// Primary CTA
<Button variant="primary" size="lg" fullWidth>Complete Exercise</Button>

// With icon
<Button variant="secondary" size="md" icon={<ChevronRight size={14} />}>View all</Button>

// Sage accent (progress actions)
<Button variant="sage" size="sm">Add Set</Button>

// Ghost (quiet navigation)
<Button variant="ghost" size="sm">View all</Button>

// Danger (destructive)
<Button variant="danger" size="sm">Delete workout</Button>
```

Variants: primary · secondary · ghost · sage · steel · danger
Sizes: sm (32px) · md (42px) · lg (52px)
Notable: fullWidth stretches to container; icon accepts any React node; pressed state scales to 0.96.
