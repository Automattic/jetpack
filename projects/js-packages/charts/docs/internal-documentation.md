# @automattic/charts Internal Documentation

## Table of Contents

1. [Introduction & Overview](#introduction--overview)
2. [Component Architecture](#component-architecture)
3. [Technical Implementation](#technical-implementation)
4. [Usage Patterns & Best Practices](#usage-patterns--best-practices)
5. [Development Workflow](#development-workflow)
6. [Dependencies & Ecosystem](#dependencies--ecosystem)

## Introduction & Overview

### Package Purpose

`@automattic/charts` is a comprehensive charting library designed specifically for Automattic products, providing interactive data visualizations with a focus on:

- **Accessibility**: WCAG 2.1 AA compliant components
- **Responsiveness**: Charts that adapt to different screen sizes
- **Consistency**: Unified design language across Automattic products
- **Performance**: Built on top of the efficient visx library
- **Developer Experience**: TypeScript support and comprehensive documentation

### Key Differentiators

Unlike generic charting libraries, @automattic/charts:

1. **Automattic-First Design**: Themes and patterns align with Automattic's design system
2. **WordPress Integration**: Seamless integration with WordPress and Jetpack ecosystems
3. **Compound Component Pattern**: Flexible composition API for building complex visualizations
4. **Built on visx**: Leverages the power of D3 through visx's React-friendly abstractions
5. **Type Safety**: Full TypeScript support with comprehensive type definitions

### Architecture Overview

The library is structured in layers:

```
┌─────────────────────────────────────┐
│         Chart Components            │
│  (BarChart, LineChart, PieChart)    │
├─────────────────────────────────────┤
│      Shared Components              │
│  (Legend, Tooltip, Annotations)     │
├─────────────────────────────────────┤
│         Providers                   │
│  (ThemeProvider, ChartContext)      │
├─────────────────────────────────────┤
│      visx Components                │
│  (@visx/xychart, @visx/shape)      │
└─────────────────────────────────────┘
```

## Component Architecture

### Available Chart Types

#### 1. BarChart
- **Purpose**: Display categorical data with rectangular bars
- **Key Features**: 
  - Vertical and horizontal orientation
  - Grouped and stacked variants
  - Animation support
  - Customizable bar styling

#### 2. LineChart
- **Purpose**: Show trends over continuous data
- **Key Features**:
  - Multiple series support
  - Annotations with labels
  - Custom glyphs for data points
  - Area fills and gradients
  - Comparison mode for series

#### 3. PieChart & PieSemiCircleChart
- **Purpose**: Display proportional data
- **Key Features**:
  - Full circle and semi-circle variants
  - Donut chart support (through composition API)
  - Animated transitions
  - Custom segment colors
  - Percentage calculations

#### 4. BarListChart
- **Purpose**: Horizontal bar visualization for rankings/lists
- **Key Features**:
  - Sorted data display
  - Value labels
  - Compact design for dashboards

#### 5. LeaderboardChart
- **Purpose**: Display ranked data with comparison
- **Key Features**:
  - Current vs. previous period comparison
  - Delta indicators
  - Progress bar visualization
  - Formatted metric values

#### 6. ConversionFunnelChart
- **Purpose**: Visualize multi-step conversion processes
- **Key Features**:
  - Step-by-step conversion rates
  - Drop-off visualization
  - Interactive selection
  - Percentage and absolute values

### Composition API

The library uses a compound component pattern, allowing flexible chart composition:

```typescript
<PieChart data={data}>
  <PieChart.Chart>
    <PieChart.Pie />
  </PieChart.Chart>
  <PieChart.Legend />
</PieChart>
```

This pattern enables:
- Fine-grained control over chart elements
- Easy addition/removal of features
- Consistent API across chart types

### Theme System

The library provides three built-in themes:

1. **defaultTheme**: Base theme with neutral colors
2. **jetpackTheme**: Jetpack-specific styling
3. **wooTheme**: WooCommerce-aligned design

Themes control:
- Color palettes
- Grid and axis styling
- Typography settings
- Component-specific configurations

### Provider Architecture

#### GlobalChartsProvider
- Manages shared chart context
- Provides theme to all child charts
- Handles global chart settings

#### ThemeProvider
- Injects theme configuration
- Supports theme merging and customization
- Enables runtime theme switching

## Technical Implementation

### Build System

The library uses Rollup for building with:

- **Multi-entry support**: Each component can be imported individually
- **Format outputs**: CommonJS and ES modules
- **CSS extraction**: Styles bundled separately
- **Type generation**: Automatic .d.ts file creation

Key configuration aspects:
```javascript
// Supports individual component imports
'@automattic/charts/bar-chart'
'@automattic/charts/line-chart'

// Preserves module structure
preserveModules: true
preserveModulesRoot: 'src'
```

### TypeScript Architecture

The library provides comprehensive type definitions:

```typescript
// Base types for all charts
type BaseChartProps<T> = {
  data: T;
  width?: number;
  height?: number;
  margin?: Margin;
  showLegend?: boolean;
  withTooltips?: boolean;
  // ... more
}

// Specific chart types extend base
type LineChartProps = BaseChartProps<SeriesData[]> & {
  annotations?: Annotation[];
  renderGlyph?: GlyphRenderer;
  // ... more
}
```

### Testing Strategy

Testing approach uses:
- **Jest**: Unit and integration tests
- **React Testing Library**: Component behavior testing
- **jest-dom**: Enhanced DOM assertions
- **Storybook**: Visual regression testing

Test categories:
1. Component rendering tests
2. Interaction tests (hover, click)
3. Data transformation tests
4. Accessibility compliance tests

### Performance Optimizations

1. **Memoization**: Using `useDeepMemo` for expensive calculations
2. **Lazy Loading**: Components can be imported individually
3. **CSS Modules**: Scoped styles prevent global pollution
4. **visx efficiency**: Leverages visx's optimized rendering

## Usage Patterns & Best Practices

### Common Implementation Patterns

#### Basic Chart Setup
```typescript
import { LineChart } from '@automattic/charts';

function MyDashboard() {
  const data = [
    {
      label: 'Series 1',
      data: [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 150 }
      ]
    }
  ];

  return (
    <LineChart
      data={data}
      height={300}
      showLegend
      withTooltips
    />
  );
}
```

#### Advanced Composition
```typescript
<LineChart data={data}>
  <LineChart.Grid />
  <LineChart.XAxis />
  <LineChart.YAxis />
  <LineChart.Lines />
  <LineChart.Annotations>
    <LineChart.Annotation datum={importantPoint} />
  </LineChart.Annotations>
  <LineChart.Tooltip />
</LineChart>
```

### Performance Considerations

1. **Data Optimization**:
   - Pre-process data outside render cycle
   - Use memoization for derived data
   - Limit data points for large datasets

2. **Rendering Optimization**:
   - Set explicit dimensions when possible
   - Use `showTooltips={false}` for static charts
   - Leverage CSS containment for chart containers

### Accessibility Features

All charts include:
- ARIA labels and descriptions
- Keyboard navigation support (where applicable)
- Screen reader announcements
- High contrast mode support
- Focus indicators

Best practices:
- Always provide meaningful `aria-label` props
- Include data tables as alternatives for complex visualizations
- Test with screen readers during development

### Integration with WordPress/Jetpack

The library is designed for seamless WordPress integration:

1. **Gutenberg Blocks**: Charts can be wrapped as blocks
2. **Admin Dashboards**: Optimized for WordPress admin UI
3. **Responsive Design**: Works with WordPress themes
4. **i18n Support**: Uses `@wordpress/i18n` for translations

## Development Workflow

### Local Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start Storybook**:
   ```bash
   pnpm run storybook
   ```

3. **Run tests**:
   ```bash
   pnpm test
   ```

4. **Build library**:
   ```bash
   pnpm run build
   ```

### Contributing Guidelines

Following the AI documentation guide:

1. **Documentation First**: Update docs before implementing features
2. **Storybook Stories**: Create stories for all variations
3. **Type Safety**: Ensure full TypeScript coverage
4. **Accessibility**: Test with keyboard and screen readers
5. **Performance**: Profile before and after changes

### Code Organization

```
src/
├── components/          # Chart components
│   ├── bar-chart/
│   │   ├── bar-chart.tsx
│   │   ├── bar-chart.module.scss
│   │   ├── stories/
│   │   └── test/
│   └── ...
├── providers/          # Context providers
├── hooks/             # Shared hooks
├── utils/             # Helper functions
└── visx/              # visx re-exports
```

## Dependencies & Ecosystem

### Core Dependencies

#### visx Integration
The library heavily leverages visx packages:

- **@visx/xychart**: High-level chart API for cartesian charts
- **@visx/shape**: Low-level shape primitives
- **@visx/scale**: D3 scale wrappers
- **@visx/axis**: Axis components
- **@visx/tooltip**: Tooltip utilities
- **@visx/responsive**: Responsive containers

visx provides:
1. React-friendly D3 abstractions
2. Modular architecture (use only what you need)
3. TypeScript support
4. Performance optimizations

#### Other Key Dependencies

- **@react-spring/web**: Animation library for smooth transitions
- **@wordpress/i18n**: Internationalization support
- **date-fns**: Date manipulation utilities
- **clsx**: Conditional className utility

### Peer Dependencies

- **React**: 17.0.0+ or 18.0.0+
- **React DOM**: Matching React version

### Development Dependencies

Key tools:
- **Rollup**: Build system with plugins
- **TypeScript**: Type checking and compilation
- **Storybook**: Component development environment
- **Jest**: Testing framework
- **Sass**: CSS preprocessing

### Ecosystem Positioning

The library fits into the broader Automattic ecosystem:

```
┌─────────────────────────────────┐
│      WordPress/Gutenberg        │
│         Applications            │
├─────────────────────────────────┤
│      @automattic/charts         │
│    (This Library)               │
├─────────────────────────────────┤
│    @automattic/components       │
│    @wordpress/components        │
├─────────────────────────────────┤
│         React Ecosystem         │
│    (React, visx, D3)            │
└─────────────────────────────────┘
```

### Version Management

The library follows semantic versioning:
- Current version: 0.27.0
- Major version 0 indicates active development
- Breaking changes documented in CHANGELOG.md

## Future Considerations

### Planned Enhancements

Based on the codebase analysis:

1. **Additional Chart Types**: Potential for scatter plots, heat maps
2. **Enhanced Interactivity**: Zoom, pan, brush selection
3. **Real-time Updates**: WebSocket data integration
4. **Export Functionality**: PNG/SVG export capabilities
5. **Accessibility Improvements**: Enhanced keyboard navigation

### Performance Roadmap

1. **Virtual Scrolling**: For large datasets
2. **Web Workers**: Offload data processing
3. **Progressive Enhancement**: Basic charts with enhanced features
4. **Lazy Component Loading**: Dynamic imports for code splitting

### API Stability

As the library approaches v1.0:
- Stabilize composition API
- Finalize TypeScript interfaces
- Document migration paths
- Establish deprecation policies

## Conclusion

@automattic/charts represents a modern approach to data visualization in the Automattic ecosystem. By building on visx and embracing React patterns, it provides a powerful yet flexible solution for creating accessible, performant charts. The library's architecture supports both simple use cases and complex, customized visualizations while maintaining consistency with Automattic's design standards.

For developers working with the library, understanding its layered architecture, composition patterns, and integration with the broader ecosystem is key to leveraging its full potential. The comprehensive type system, thorough testing approach, and commitment to accessibility make it a robust choice for production applications.