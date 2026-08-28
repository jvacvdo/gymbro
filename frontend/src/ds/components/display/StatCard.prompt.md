Stacked metric block: LABEL / large number / unit — used in stat rows across GymBro.

```jsx
// Three-stat row (Home screen)
<div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
  <StatCard label="Calories" value="612" unit="kcal" />
  <StatCard label="Duration" value="72"  unit="min"  />
  <StatCard label="Exercises" value="6" unit="/6" trend="up" trendValue="2" />
</div>

// With trend
<StatCard label="Volume" value="12,540" unit="kg" trend="up" trendValue="18%" size="lg" />
```

Props: label · value · unit · trend (up|down|neutral) · trendValue · size (sm|md|lg)
Notable: value always renders in GT Super Display Bold; label/unit always in Suisse Intl Mono uppercase.
