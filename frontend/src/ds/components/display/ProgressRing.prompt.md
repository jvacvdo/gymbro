GymBro's signature data visualization element — a 270° arc with glowing tip.

```jsx
// Home screen — large volume ring
<ProgressRing
  size={160}
  progress={0.62}
  value="12,540"
  label="KG"
  color="sage"
/>

// Progress screen — smaller metric ring
<ProgressRing
  size={80}
  progress={0.72}
  value="72%"
  label="STR"
  color="steel"
  strokeWidth={4}
/>

// No animation (e.g. for static export)
<ProgressRing size={100} progress={0.5} value="50%" animated={false} />
```

Props: size (px) · progress (0–1) · value (center text) · label · sublabel · color (sage|steel|none)
Notable: animates on mount with ease-out-quart; glow filter applied to progress arc only.
Arc geometry: 270° visible, gap at 6 o'clock; starts from ~7 o'clock going clockwise.
