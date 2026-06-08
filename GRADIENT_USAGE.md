# Gradient Usage Guide

This document describes how to use gradient effects in the PhyNetix application.

## Available Gradient Classes

### Text Gradient
Apply gradient to text elements:
```tsx
<h1 className="gradient-text">Beautiful Gradient Text</h1>
```

### Button Gradient
Use the gradient variant on Button components:
```tsx
<Button variant="gradient">Click Me</Button>
```

### Logo Background Gradient
Apply gradient as a solid background to logo containers:
```tsx
<div className="gradient-logo w-10 h-10 rounded-xl">
  <Sparkles className="w-6 h-6 text-primary-foreground" />
</div>
```

### Icon/Logo Gradient (Text Fill)
Apply gradient to icons using background-clip technique:
```tsx
<div className="gradient-icon">
  <YourIcon className="w-6 h-6" />
</div>
```

### SVG Gradient Fill
For SVG elements that need gradient fill, use the `gradient-fill` class on the SVG element and define the gradient:
```tsx
<svg className="gradient-fill" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="hsl(217, 91%, 45%)" />
      <stop offset="50%" stopColor="hsl(270, 76%, 55%)" />
      <stop offset="100%" stopColor="hsl(280, 87%, 50%)" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="40" />
</svg>
```

## Theme Support

All gradient effects automatically adapt to light and dark modes using CSS variables:

- **Light mode**: Blue → Purple → Fuchsia gradient (hsl(217, 91%, 45%) → hsl(270, 76%, 55%) → hsl(280, 87%, 50%))
- **Dark mode**: Teal → Blue gradient (hsl(172, 66%, 50%) → hsl(199, 89%, 48%))

## CSS Variables

The gradients are defined using CSS variables in `src/index.css`:

- `--gradient-primary`: Main gradient (changes based on theme)
- `--gradient-secondary`: Alternative gradient
- `--gradient-glass`: Subtle glass effect gradient
- `--glow-primary`: Glow shadow effect for gradients

## Examples

### Button with Gradient
```tsx
<Button variant="gradient" size="lg">
  Get Started <ArrowRight />
</Button>
```

### Logo with Gradient Background
```tsx
<Link to="/" className="flex items-center gap-2">
  <div className="w-10 h-10 rounded-xl gradient-logo flex items-center justify-center">
    <Sparkles className="w-6 h-6 text-primary-foreground" />
  </div>
  <span className="text-xl font-bold gradient-text">PhyNetix</span>
</Link>
```

### Glass Button with Gradient Hover
```tsx
<Button variant="glass">
  Hover for gradient effect
</Button>
```
