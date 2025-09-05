import { defaultTheme } from '../../../providers/theme';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
	trafficSourcesData as sampleData,
	shortTrafficSourcesData as smallDataset,
	revenueMetricsData as largeValues,
	decliningMetricsData as negativeGrowth,
	categorizedMetricsData as dataWithImageColor,
	themeArgTypes,
	CHART_THEME_MAP,
} from '../../../stories';
import { formatMetricValue } from '../../../utils';
import { hexToRgba } from '../../../utils/color-utils';
import LeaderboardChart from '../leaderboard-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LeaderboardChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Leaderboard Chart',
	component: LeaderboardChart,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
A flexible and accessible leaderboard chart component for displaying ranked data with WordPress ProgressBar components and optional comparison values.

## Features

- 📊 Clean, responsive leaderboard visualization
- 🎨 Customizable colors and styling
- 🔄 Optional comparison data support
- 📱 Mobile-friendly design
- 🎯 TypeScript support with full type definitions
- ♿ Accessible design
- 🧪 Comprehensive test coverage

## Usage

### Basic Usage

\`\`\`typescript
import { LeaderboardChart } from '@automattic/charts';

const data = [
  {
    id: 'direct',
    label: 'Direct',
    currentValue: 12500,
    previousValue: 10000,
    currentShare: 100,
    previousShare: 80,
    delta: 25,
  },
  // ... more entries
];

function MyComponent() {
  return (
    <LeaderboardChart
      data={data}
      withComparison={true}
      primaryColor="#3858E9"
      secondaryColor="#66BDFF"
    />
  );
}
\`\`\`

### With Custom Formatters

\`\`\`typescript
import { LeaderboardChart } from '@automattic/charts';

function CustomFormattedChart() {
  return (
    <LeaderboardChart
      data={data}
      withComparison={true}
      valueFormatter={(value) => \`$\${(value / 1000).toFixed(1)}k\`}
      deltaFormatter={(value) => \`\${value > 0 ? '+' : ''}\${value}%\`}
    />
  );
}
\`\`\`

### Preparing Your Data

The LeaderboardChart expects pre-processed data. You'll need to transform your raw data into the required format:

\`\`\`typescript
import { LeaderboardChart } from '@automattic/charts';

// Transform your raw data into LeaderboardEntry format
function transformRawData(rawData) {
  const maxValue = Math.max(...rawData.map(item => item.current_period.value));

  return rawData.map(item => ({
    id: item.id,
    label: item.name,
    currentValue: item.current_period.value,
    previousValue: item.previous_period.value,
    currentShare: (item.current_period.value / maxValue) * 100,
    previousShare: (item.previous_period.value / maxValue) * 100,
    delta: ((item.current_period.value - item.previous_period.value) / item.previous_period.value) * 100,
  }));
}

function ProcessedDataChart() {
  const processedData = transformRawData(rawData);

  return (
    <LeaderboardChart
      data={processedData}
      withComparison={true}
    />
  );
}
\`\`\`

## LeaderboardEntry Interface

\`\`\`typescript
interface LeaderboardEntry {
  id: string;              // Unique identifier
  label: string;           // Display name
  currentValue: number;    // Current period value
  previousValue: number;   // Previous period value
  currentShare: number;    // Current bar width (0-100)
  previousShare: number;   // Previous bar width (0-100)
  delta: number;           // Percentage change
}
\`\`\`

## Data Transformation

Since the LeaderboardChart expects pre-processed data, you'll need to handle data transformation in your application. This gives you full control over how your specific data structures are converted and allows for custom business logic.

## Styling

The component uses CSS Modules for styling. You can customize the border radius using CSS custom properties:

\`\`\`css
.myCustomChart {
	--a8c--charts--leaderboard--bar--border-radius: 8px;
}
\`\`\`

## Accessibility

The component includes:
- Semantic HTML structure
- Proper color contrast ratios
- Keyboard navigation support
- Screen reader compatible markup

## Examples

### E-commerce Sales Channels

\`\`\`typescript
const salesData = [
  { id: 'organic', label: 'Organic Search', currentValue: 45000, previousValue: 38000, currentShare: 100, previousShare: 84, delta: 18 },
  { id: 'paid', label: 'Paid Advertising', currentValue: 32000, previousValue: 35000, currentShare: 71, previousShare: 78, delta: -9 },
  { id: 'social', label: 'Social Media', currentValue: 18000, previousValue: 15000, currentShare: 40, previousShare: 33, delta: 20 },
  { id: 'email', label: 'Email Marketing', currentValue: 12000, previousValue: 11000, currentShare: 27, previousShare: 24, delta: 9 },
];

<LeaderboardChart data={salesData} withComparison={true} />
\`\`\`

### Traffic Sources

\`\`\`typescript
const trafficData = [
  { id: 'direct', label: 'Direct', currentValue: 15420, previousValue: 13200, currentShare: 100, previousShare: 86, delta: 17 },
  { id: 'search', label: 'Search Engines', currentValue: 12350, previousValue: 11800, currentShare: 80, previousShare: 77, delta: 5 },
  { id: 'social', label: 'Social Networks', currentValue: 8760, previousValue: 9200, currentShare: 57, previousShare: 60, delta: -5 },
];

<LeaderboardChart data={trafficData} withComparison={true} />
\`\`\`
				`,
			},
		},
	},
	tags: [ 'autodocs' ],
	argTypes: {
		data: {
			control: 'object',
			description: 'Array of leaderboard entries to display',
			table: {
				type: { summary: 'LeaderboardEntry[]' },
			},
		},
		withComparison: {
			control: 'boolean',
			description: 'Whether to show comparison data (previous period bars and delta values)',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		primaryColor: {
			control: 'color',
			description: 'Primary color for current period bars',
			table: {
				defaultValue: { summary: defaultTheme.leaderboardChart.primaryColor },
			},
		},
		secondaryColor: {
			control: 'color',
			description: 'Secondary color for comparison period bars',
			table: {
				defaultValue: { summary: defaultTheme.leaderboardChart.secondaryColor },
			},
		},
		valueFormatter: {
			control: false,
			description: 'Custom formatter function for values',
			table: {
				type: { summary: '(value: number) => string' },
				defaultValue: { summary: 'formatMetricValue with compact notation' },
			},
		},
		deltaFormatter: {
			control: false,
			description: 'Custom formatter function for delta values',
			table: {
				type: { summary: '(value: number) => string' },
				defaultValue: { summary: 'formatMetricValue as percentage' },
			},
		},
		loading: {
			control: 'boolean',
			description: 'Whether the chart is in loading state',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		className: {
			control: 'text',
			description: 'Additional CSS class name for the chart container',
			table: {
				type: { summary: 'string' },
			},
		},
		style: {
			control: 'object',
			description: 'Custom styling for the chart container',
			table: {
				type: { summary: 'React.CSSProperties' },
			},
		},
		...sharedChartArgTypes,
		...themeArgTypes,
	},
	args: {
		primaryColor: undefined,
		secondaryColor: undefined,
		themeName: 'default',
	},
	decorators: [ chartDecorator ],
};

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
	},
};

export const WithoutComparison: Story = {
	args: {
		data: sampleData,
		withComparison: false,
		loading: false,
	},
};

export const WithOverlayLabel: Story = {
	args: {
		data: sampleData,
		withOverlayLabel: true,
	},
};

export const Loading: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: true,
	},
};

export const CustomColors: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		primaryColor: 'red',
		secondaryColor: 'green',
	},
};

export const SmallDataset: Story = {
	args: {
		data: smallDataset,
		withComparison: true,
		loading: false,
	},
};

export const EmptyData: Story = {
	args: {
		data: [],
		withComparison: true,
		loading: false,
	},
};

export const LargeValues: Story = {
	args: {
		data: largeValues,
		withComparison: true,
		loading: false,
	},
};

export const NegativeGrowth: Story = {
	args: {
		data: negativeGrowth,
		withComparison: true,
		loading: false,
	},
};

export const CurrencyFormatting: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) =>
			formatMetricValue( value, 'currency', {
				useMultipliers: true,
				decimals: 1,
			} ),
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 0,
			} ),
	},
};

export const NumberFormatting: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) =>
			formatMetricValue( value, 'number', {
				useMultipliers: false,
				decimals: 0,
			} ),
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 1,
			} ),
	},
};

const CustomLabelComponent = ( { label, imageColor, style = {} } ) => (
	<div
		style={ {
			display: 'flex',
			alignItems: 'center',
			gap: '8px',
			...style,
		} }
	>
		<img
			src={ `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><rect width='50' height='50' fill='${ encodeURIComponent(
				imageColor
			) }'/></svg>` }
			alt="icon"
			style={ {
				width: '28px',
				height: '28px',
				verticalAlign: 'middle',
				borderRadius: '4px',
			} }
		/>
		<span style={ { fontSize: '13px' } }>{ label }</span>
	</div>
);

export const CustomLabel: Story = {
	args: {
		data: dataWithImageColor.map( entry => ( {
			...entry,
			label: <CustomLabelComponent label={ entry.label } imageColor={ entry.imageColor } />,
		} ) ),
		withComparison: false,
		loading: false,
	},
};

export const AdvancedFormatting: Story = {
	args: {
		data: largeValues,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) => {
			if ( value >= 1000000 ) {
				return formatMetricValue( value, 'currency', {
					useMultipliers: true,
					decimals: 1,
				} );
			}
			return formatMetricValue( value, 'currency', {
				useMultipliers: false,
				decimals: 0,
			} );
		},
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 1,
				signDisplay: 'always',
			} ),
	},
};

export const OverlayLabelWithImage: Story = {
	args: {
		data: dataWithImageColor.map( entry => ( {
			...entry,
			label: (
				<CustomLabelComponent
					label={ entry.label }
					imageColor={ entry.imageColor }
					style={ { padding: '6px' } }
				/>
			),
		} ) ),
		withComparison: true,
		withOverlayLabel: true,
		loading: false,
		style: {
			'--a8c--charts--leaderboard--bar--border-radius': '4px',
			fontFamily: `"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif`,
		},
	},
	render: args => {
		const themeName = args.themeName || 'default';
		const theme = CHART_THEME_MAP[ themeName ];
		const primaryColor =
			theme?.leaderboardChart?.primaryColor || defaultTheme.leaderboardChart.primaryColor;
		const primaryColorWithAlpha = hexToRgba( primaryColor, 0.08 );

		return <LeaderboardChart { ...args } primaryColor={ primaryColorWithAlpha } />;
	},
};
