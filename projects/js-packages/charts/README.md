# Automattic Charts

A comprehensive charting library for displaying interactive data visualizations within Automattic products. Built on top of modern libraries like `@visx/xychart` and designed for accessibility, responsiveness, and ease of use.

Explore the available charts and their documentation in [Storybook](https://automattic.github.io/jetpack-storybook/?path=/docs/js-packages-charts).

## Requirements

- **Node.js**: >= 20.10.0 (required by `@wordpress/ui` dependency)
- **React**: 17.x or 18.x

## Quick Start

### Installation

```bash
npm install @automattic/charts
# or
pnpm add @automattic/charts
# or
yarn add @automattic/charts
```

### Importing Components

You can import charts from the package in several ways depending on your needs:

#### Option 1: Import everything from the main entry (includes all styles)

```javascript
import { LineChart, BarChart, PieChart } from '@automattic/charts';
import '@automattic/charts/style.css'; // Import all styles
```

#### Option 2: Import individual components (tree-shaking friendly)

For better bundle optimization, you can import components individually:

```javascript
// Import individual components
import { LineChart } from '@automattic/charts/line-chart';
import { BarChart } from '@automattic/charts/bar-chart';
import { PieChart } from '@automattic/charts/pie-chart';
import { GeoChart } from '@automattic/charts/geo-chart';
import { Sparkline } from '@automattic/charts/sparkline';

// Import individual component styles
import '@automattic/charts/line-chart/style.css';
import '@automattic/charts/bar-chart/style.css';
import '@automattic/charts/pie-chart/style.css';
import '@automattic/charts/geo-chart/style.css';
import '@automattic/charts/sparkline/style.css';
```

Individual entry exports also provide easier access to chart-specific types and helpers when available. This makes it simpler to find and leverage TypeScript types, utility functions, and other chart-specific tools that are exported alongside the main component.

#### Available Components and Entry Points

The following components can be imported individually:

- `@automattic/charts/bar-chart` - Bar Chart component
- `@automattic/charts/bar-list-chart` - Bar List Chart component
- `@automattic/charts/conversion-funnel-chart` - Conversion Funnel Chart component
- `@automattic/charts/geo-chart` - Geo Chart component
- `@automattic/charts/leaderboard-chart` - Leaderboard Chart component
- `@automattic/charts/legend` - Legend component
- `@automattic/charts/line-chart` - Line Chart component
- `@automattic/charts/pie-chart` - Pie Chart component
- `@automattic/charts/pie-semi-circle-chart` - Pie Semi-Circle Chart component
- `@automattic/charts/sparkline` - Sparkline component
- `@automattic/charts/tooltip` - Tooltip component
- `@automattic/charts/trend-indicator` - Trend Indicator component
- `@automattic/charts/hooks` - React hooks
- `@automattic/charts/providers` - Context providers
- `@automattic/charts/visx/group` - Visx group utilities
- `@automattic/charts/visx/legend` - Visx legend utilities
- `@automattic/charts/visx/text` - Visx text utilities

#### Available Style Imports

Each component has its own CSS file that can be imported individually:

- `@automattic/charts/bar-chart/style.css`
- `@automattic/charts/bar-list-chart/style.css`
- `@automattic/charts/conversion-funnel-chart/style.css`
- `@automattic/charts/geo-chart/style.css`
- `@automattic/charts/leaderboard-chart/style.css`
- `@automattic/charts/legend/style.css`
- `@automattic/charts/line-chart/style.css`
- `@automattic/charts/pie-chart/style.css`
- `@automattic/charts/pie-semi-circle-chart/style.css`
- `@automattic/charts/sparkline/style.css`
- `@automattic/charts/tooltip/style.css`
- `@automattic/charts/trend-indicator/style.css`

### Basic Usage Example

```javascript
import React from 'react';
import { LineChart } from '@automattic/charts';
import '@automattic/charts/line-chart/style.css';

const data = [
	{ date: new Date( '2024-01-01' ), value: 10 },
	{ date: new Date( '2024-01-02' ), value: 90 }, // Sharp rise
	{ date: new Date( '2024-01-03' ), value: 85 }, // Slight decline
	{ date: new Date( '2024-01-04' ), value: 82 }, // Gradual decline
	{ date: new Date( '2024-01-05' ), value: 5 }, // Sharp drop
	{ date: new Date( '2024-01-06' ), value: 8 }, // Slight rise
	{ date: new Date( '2024-01-07' ), value: 10 }, // Gradual rise
];

function MyComponent() {
	return <LineChart data={ data } width={ 400 } height={ 300 } />;
}
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Contributing

Ready to contribute? Check out the [Jetpack contributing guide](https://github.com/Automattic/jetpack/blob/trunk/docs/CONTRIBUTING.md) and the [Charts AI documentation guide](https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/charts/docs/ai-documentation-guide.md) for detailed information on adding new features and documentation.

### Local development with Storybook

To run Storybook locally, from the root of the monorepo follow these steps:

1. Run `pnpm install` to install the dependencies.
2. Run `cd projects/js-packages/charts` to navigate to the charts package.
3. Run `pnpm run storybook` to start the storybook server.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Charts is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
