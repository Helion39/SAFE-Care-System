export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const componentClasses = {
  // Card variants
  card: {
    base: 'card-base',
    compact: 'card-compact',
    metric: 'metric-card-base',
    interactive: 'card-base hover-lift click-scale',
  },
  
  // Button variants
  button: {
    primary: 'btn-primary-pastel',
    secondary: 'btn-secondary-pastel',
    success: 'btn-success-pastel',
    warning: 'btn-warning-pastel',
    error: 'btn-error-pastel',
    small: 'btn-sm-pastel',
    large: 'btn-lg-pastel',
  },
  
  // Form variants
  form: {
    group: 'form-group-base',
    label: 'label-base',
    input: 'input-base input-focus',
    inputError: 'input-base input-error',
  },
  
  // Badge variants
  badge: {
    primary: 'badge-primary-pastel',
    secondary: 'badge-secondary-pastel',
    success: 'badge-success-pastel',
    warning: 'badge-warning-pastel',
    error: 'badge-error-pastel',
  },
  
  // Alert variants
  alert: {
    success: 'alert-success-pastel',
    warning: 'alert-warning-pastel',
    error: 'alert-error-pastel',
    info: 'alert-info-pastel',
  },
  
  // Healthcare-specific variants
  healthcare: {
    vitalsNormal: 'vitals-normal',
    vitalsWarning: 'vitals-warning',
    vitalsCritical: 'vitals-critical',
    incidentActive: 'incident-active',
    incidentClaimed: 'incident-claimed',
    incidentResolved: 'incident-resolved',
  },
  
  // Status variants
  status: {
    active: 'status-active',
    inactive: 'status-inactive',
    warning: 'status-warning',
    error: 'status-error',
  },
  
  // Animation variants
  animation: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    bounceSubtle: 'animate-bounce-subtle',
    hoverLift: 'hover-lift',
    clickScale: 'click-scale',
  },
};

export const patterns = {
  metricCard: (variant: 'default' | 'interactive' = 'default') => {
    return cn(
      componentClasses.card.metric,
      variant === 'interactive' && componentClasses.animation.hoverLift
    );
  },
  
  button: (
    variant: keyof typeof componentClasses.button = 'primary',
    size?: 'small' | 'large'
  ) => {
    return cn(
      componentClasses.button[variant],
      size === 'small' && componentClasses.button.small,
      size === 'large' && componentClasses.button.large
    );
  },
  
  input: (hasError: boolean = false) => {
    return hasError ? componentClasses.form.inputError : componentClasses.form.input;
  },
  
  healthcareBadge: (type: 'vitals' | 'incident', status: string) => {
    if (type === 'vitals') {
      switch (status.toLowerCase()) {
        case 'normal':
          return componentClasses.healthcare.vitalsNormal;
        case 'warning':
          return componentClasses.healthcare.vitalsWarning;
        case 'critical':
          return componentClasses.healthcare.vitalsCritical;
        default:
          return componentClasses.badge.secondary;
      }
    } else if (type === 'incident') {
      switch (status.toLowerCase()) {
        case 'active':
          return componentClasses.healthcare.incidentActive;
        case 'claimed':
          return componentClasses.healthcare.incidentClaimed;
        case 'resolved':
          return componentClasses.healthcare.incidentResolved;
        default:
          return componentClasses.badge.secondary;
      }
    }
    return componentClasses.badge.secondary;
  },
  
  grid: (columns: 2 | 3 | 4 = 4) => {
    switch (columns) {
      case 2:
        return 'grid grid-cols-1 lg:grid-cols-2 gap-6';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      case 4:
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';
    }
  },
};

export const spacing = {
  // Margin utilities
  margin: {
    xs: 'm-1',      // 8px
    sm: 'm-2',      // 16px
    md: 'm-3',      // 24px
    lg: 'm-4',      // 32px
    xl: 'm-6',      // 48px
  },
  
  // Padding utilities
  padding: {
    xs: 'p-1',      // 8px
    sm: 'p-2',      // 16px
    md: 'p-3',      // 24px
    lg: 'p-4',      // 32px
    xl: 'p-6',      // 48px
  },
  
  // Gap utilities for flexbox/grid
  gap: {
    xs: 'gap-1',    // 8px
    sm: 'gap-2',    // 16px
    md: 'gap-3',    // 24px
    lg: 'gap-4',    // 32px
    xl: 'gap-6',    // 48px
  },
  
  // Space between utilities
  space: {
    xs: 'space-y-1',    // 8px
    sm: 'space-y-2',    // 16px
    md: 'space-y-4',    // 32px
    lg: 'space-y-6',    // 48px
    xl: 'space-y-8',    // 64px
  },
};

export const typography = {
  heading: {
    h1: 'text-2xl font-bold text-gray-800',
    h2: 'text-xl font-semibold text-gray-700',
    h3: 'text-lg font-medium text-gray-700',
    h4: 'text-base font-medium text-gray-700',
  },
  
  body: {
    large: 'text-base text-gray-700',
    default: 'text-sm text-gray-600',
    small: 'text-xs text-gray-500',
  },
  
  label: {
    default: 'text-sm font-medium text-gray-700',
    required: 'text-sm font-medium text-gray-700 after:content-["*"] after:text-error after:ml-1',
  },
};

export const colors = {
  text: {
    primary: 'text-gray-800',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  },
  
  background: {
    primary: 'bg-pastel-primary',
    secondary: 'bg-pastel-secondary',
    white: 'bg-pastel-white',
    page: 'bg-pastel-background',
    success: 'bg-success-light',
    warning: 'bg-warning-light',
    error: 'bg-error-light',
    info: 'bg-info-light',
  },
  
  border: {
    default: 'border-gray-200',
    success: 'border-success/20',
    warning: 'border-warning/20',
    error: 'border-error/20',
    info: 'border-info/20',
  },
};