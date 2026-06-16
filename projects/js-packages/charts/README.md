# Automattic Charts

A comprehensive charting library for displaying interactive data visualizations within Automattic products. Built on top of modern libraries like `@visx/xychart` and designed for accessibility, responsiveness, and ease of use.

Explore the available charts and their documentation in [Storybook](https://automattic.github.io/jetpack-storybook/?path=/docs/js-packages-charts-library-introduction--docs).

## Requirements

- **Node.js**: >= 20.11.0
- **React**: 18.x or 19.x

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

Import chart components from the main entry point:

```javascript
import { LineChart, BarChart, PieChart } from '@automattic/charts';
import '@automattic/charts/style.css';
```

Modern bundlers tree-shake unused JavaScript automatically, so only the chart components you import are included in your bundle. Note that `style.css` includes styles for all charts.

#### Additional Entry Points

For utilities and auxiliary components, separate entry points are available:

- `@automattic/charts/hooks` - React hooks
- `@automattic/charts/providers` - Context providers
- `@automattic/charts/utils` - Shared chart utility functions
- `@automattic/charts/visx/group` - Visx group utilities
- `@automattic/charts/visx/legend` - Visx legend utilities
- `@automattic/charts/visx/text` - Visx text utilities

#### Available Style Imports

- `@automattic/charts/style.css` - All chart styles

### Basic Usage Example

```javascript
import React from 'react';
import { LineChart } from '@automattic/charts';
import '@automattic/charts/style.css';

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
