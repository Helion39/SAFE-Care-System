# SAFE Pastel Design Component Patterns

This document outlines the available Tailwind-based component patterns for the SAFE healthcare system.

## Card Components

### Base Card
```jsx
<div className="card-base">
  <div className="card-header-base">
    <Icon className="w-5 h-5 text-info" />
    Card Title
  </div>
  <div className="space-y-4">
    Card content goes here
  </div>
</div>
```

### Compact Card
```jsx
<div className="card-compact">
  <h3 className="text-sm font-medium text-gray-700 mb-2">Compact Card</h3>
  <p className="text-sm text-gray-600">Less padding for dense layouts</p>
</div>
```

### Metric Card
```jsx
<div className="metric-card-base">
  <div className="metric-icon-base">
    <Icon className="w-6 h-6 text-info" />
  </div>
  <div className="metric-number-base">42</div>
  <div className="metric-label-base">Active Residents</div>
</div>
```

## Button Components

### Primary Button
```jsx
<button className="btn-primary-pastel">
  <Icon className="w-4 h-4" />
  Primary Action
</button>
```

### Secondary Button
```jsx
<button className="btn-secondary-pastel">
  Secondary Action
</button>
```

### Status Buttons
```jsx
<button className="btn-success-pastel">Success Action</button>
<button className="btn-warning-pastel">Warning Action</button>
<button className="btn-error-pastel">Error Action</button>
```

### Button Sizes
```jsx
<button className="btn-primary-pastel btn-sm-pastel">Small</button>
<button className="btn-primary-pastel">Default</button>
<button className="btn-primary-pastel btn-lg-pastel">Large</button>
```

## Form Components

### Input Field
```jsx
<div className="form-group-base">
  <label className="label-base">Field Label</label>
  <input 
    className="input-base input-focus" 
    placeholder="Enter value..."
  />
</div>
```

### Input with Error
```jsx
<div className="form-group-base">
  <label className="label-base">Field Label</label>
  <input 
    className="input-base input-error" 
    placeholder="Enter value..."
  />
  <p className="text-xs text-error mt-1">Error message</p>
</div>
```

## Badge Components

```jsx
<span className="badge-primary-pastel">Primary</span>
<span className="badge-success-pastel">Success</span>
<span className="badge-warning-pastel">Warning</span>
<span className="badge-error-pastel">Error</span>
<span className="badge-secondary-pastel">Secondary</span>
```

## Alert Components

```jsx
<div className="alert-success-pastel">
  <CheckCircle className="w-4 h-4 inline mr-2" />
  Success message
</div>

<div className="alert-warning-pastel">
  <AlertTriangle className="w-4 h-4 inline mr-2" />
  Warning message
</div>

<div className="alert-error-pastel">
  <XCircle className="w-4 h-4 inline mr-2" />
  Error message
</div>

<div className="alert-info-pastel">
  <Info className="w-4 h-4 inline mr-2" />
  Info message
</div>
```

## Table Components

```jsx
<div className="table-container">
  <table className="table-base">
    <thead>
      <tr>
        <th className="table-header">Header 1</th>
        <th className="table-header">Header 2</th>
      </tr>
    </thead>
    <tbody>
      <tr className="table-row-hover">
        <td className="table-cell">Data 1</td>
        <td className="table-cell">Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Navigation Components

### Top Navigation
```jsx
<nav className="nav-base">
  <div className="nav-container">
    <div className="flex items-center gap-3">
      <span className="nav-brand">SAFE Care System</span>
      <span className="badge-primary-pastel">Admin</span>
    </div>
    <div className="nav-user">
      <span className="text-sm text-gray-600">Welcome, John</span>
      <button className="btn-secondary-pastel btn-sm-pastel">Logout</button>
    </div>
  </div>
</nav>
```

### Tab Navigation
```jsx
<div className="tabs-container">
  <nav className="tabs-list">
    <button className="tab-active">Active Tab</button>
    <button className="tab-inactive">Inactive Tab</button>
  </nav>
</div>
```

## Layout Components

### Page Layout
```jsx
<div className="page-container">
  <nav className="nav-base">
    {/* Navigation */}
  </nav>
  <main className="main-container">
    {/* Main content */}
  </main>
</div>
```

### Responsive Grids
```jsx
<!-- 4-column responsive grid -->
<div className="grid-responsive">
  <div className="metric-card-base">Card 1</div>
  <div className="metric-card-base">Card 2</div>
  <div className="metric-card-base">Card 3</div>
  <div className="metric-card-base">Card 4</div>
</div>

<!-- 2-column responsive grid -->
<div className="grid-2-responsive">
  <div className="card-base">Left content</div>
  <div className="card-base">Right content</div>
</div>

<!-- 3-column responsive grid -->
<div className="grid-3-responsive">
  <div className="card-base">Card 1</div>
  <div className="card-base">Card 2</div>
  <div className="card-base">Card 3</div>
</div>
```

## Emergency Alert Components

```jsx
<div className="emergency-alert-base">
  <div className="emergency-alert-content">
    <div className="flex items-center gap-3">
      <div className="emergency-alert-icon">
        <AlertTriangle className="w-5 h-5 text-error" />
      </div>
      <div>
        <div className="font-medium text-error">Emergency Alert</div>
        <div className="text-sm text-gray-600">Fall detected - Room 204</div>
      </div>
    </div>
    <div className="flex gap-2">
      <button className="btn-error-pastel btn-sm-pastel">Claim</button>
      <button className="btn-secondary-pastel btn-sm-pastel">Details</button>
    </div>
  </div>
</div>
```

## Status Indicators

```jsx
<span className="badge-base status-active">Active</span>
<span className="badge-base status-inactive">Inactive</span>
<span className="badge-base status-warning">Warning</span>
<span className="badge-base status-error">Error</span>
```

## Healthcare-Specific Components

### Vitals Status
```jsx
<span className="badge-base vitals-normal">Normal</span>
<span className="badge-base vitals-warning">Warning</span>
<span className="badge-base vitals-critical">Critical</span>
```

### Incident Status
```jsx
<span className="badge-base incident-active">Active</span>
<span className="badge-base incident-claimed">Claimed</span>
<span className="badge-base incident-resolved">Resolved</span>
```

## Animation and Interaction Classes

### Hover Effects
```jsx
<div className="card-base hover-lift">Lifts on hover</div>
<button className="btn-primary-pastel click-scale">Scales on click</button>
```

### Animations
```jsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-up">Slides up</div>
<div className="animate-bounce-subtle">Subtle bounce</div>
```

## Accessibility Classes

```jsx
<button className="btn-primary-pastel focus-visible-base">
  Accessible button
</button>

<span className="sr-only">Screen reader only text</span>
```

## Usage Guidelines

1. **Consistency**: Always use the predefined patterns instead of custom styling
2. **Responsive**: All patterns are mobile-first and responsive
3. **Accessibility**: Patterns include proper focus states and ARIA support
4. **Performance**: Use @layer components for better CSS optimization
5. **Maintenance**: Update patterns in this file, not individual components

## Color Reference

- **Primary**: `#C6E7FF` (pastel-primary)
- **Secondary**: `#D4F6FF` (pastel-secondary)  
- **Background**: `#FBFBFB` (pastel-background)
- **White**: `#FFFFFF` (pastel-white)
- **Success**: `#E8F5E8` (success-light) / `#2E7D32` (success)
- **Warning**: `#FFF8E1` (warning-light) / `#F57F17` (warning)
- **Error**: `#FFEBEE` (error-light) / `#C62828` (error)
- **Info**: `#E3F2FD` (info-light) / `#1565C0` (info)