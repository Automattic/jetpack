import { Meta, StoryObj } from '@storybook/react';
import { ChartProvider } from '../../../providers/chart-context';
import { useChartTheme } from '../../../providers/theme';
import { BarChart } from '../../bar-chart';
import { LineChart } from '../../line-chart';
import { PieChart } from '../../pie-chart';
import { Legend } from '../legend';
import { useChartLegendData } from '../use-chart-legend-data';
import type { SeriesData, DataPointPercentage } from '../../../types';

const meta: Meta< typeof Legend > = {
	title: 'JS Packages/Charts/Composites/Legend',
	component: Legend,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
The Legend component provides a flexible way to display chart legends either as standalone components or integrated with charts through the chart context.

## Key Features

- **Standalone Usage**: Display legends independently from charts
- **Context Integration**: Automatically retrieve legend data from charts using \`chartId\`
- **Flexible Positioning**: Place legends anywhere in your layout
- **Works with Hidden Legends**: Charts with \`showLegend={false}\` still provide data to standalone legends
- **Full Customization**: Inherits all props from BaseLegend for complete control

## Usage Examples

### Basic Usage with Manual Data
\`\`\`jsx
<Legend 
  items={[
    { label: 'Series 1', value: '25%', color: '#3858E9' },
    { label: 'Series 2', value: '35%', color: '#80C8FF' }
  ]}
  orientation="horizontal"
/>
\`\`\`

### Automatic Data from Chart Context
\`\`\`jsx
// Chart registers its legend data with chartId
<LineChart 
  chartId="sales-chart" 
  data={salesData}
  showLegend={false} // Legend hidden on chart
/>

// Standalone legend retrieves data automatically
<Legend 
  chartId="sales-chart"
  orientation="vertical"
  alignmentHorizontal="right"
/>
\`\`\`

### Dashboard Layout Example
\`\`\`jsx
<div className="dashboard">
  <div className="charts-grid">
    <LineChart chartId="revenue" showLegend={false} />
    <BarChart chartId="units" showLegend={false} />
    <PieChart chartId="regions" showLegend={false} />
  </div>
  <aside className="legend-panel">
    <Legend chartId="revenue" />
    <Legend chartId="units" />
    <Legend chartId="regions" />
  </aside>
</div>
\`\`\`
`,
			},
		},
	},
};

export default meta;
type Story = StoryObj< typeof Legend >;

// Mock data for different chart types
const lineChartData: SeriesData[] = [
	{
		label: 'Desktop',
		data: [
			{ date: new Date( '2023-01-01' ), value: 100 },
			{ date: new Date( '2023-01-02' ), value: 150 },
			{ date: new Date( '2023-01-03' ), value: 120 },
		],
	},
	{
		label: 'Mobile',
		data: [
			{ date: new Date( '2023-01-01' ), value: 80 },
			{ date: new Date( '2023-01-02' ), value: 90 },
			{ date: new Date( '2023-01-03' ), value: 110 },
		],
	},
];

const barChartData: SeriesData[] = [
	{
		label: 'Q1 Sales',
		data: [
			{ label: 'Jan', value: 1000 },
			{ label: 'Feb', value: 1200 },
			{ label: 'Mar', value: 1100 },
		],
	},
	{
		label: 'Q2 Sales',
		data: [
			{ label: 'Jan', value: 800 },
			{ label: 'Feb', value: 900 },
			{ label: 'Mar', value: 1000 },
		],
	},
];

const pieChartData: DataPointPercentage[] = [
	{ label: 'Desktop', value: 65, percentage: 65 },
	{ label: 'Mobile', value: 35, percentage: 35 },
];

// Basic standalone legends
export const Horizontal: Story = {
	args: {
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
		],
		orientation: 'horizontal',
	},
};

export const Vertical: Story = {
	args: {
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
			{ label: 'Tablet', value: '12%', color: '#44B556' },
		],
		orientation: 'vertical',
	},
};

// Story showing use with LineChart data
const WithLineChartData = () => {
	const theme = useChartTheme();
	const legendItems = useChartLegendData( lineChartData, theme, {
		showValues: false,
	} );

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '20px' } }>
			<LineChart
				data={ lineChartData }
				showLegend={ false }
				width={ 600 }
				height={ 300 }
				withGradientFill={ false }
				withLegendGlyph={ false }
			/>
			<Legend items={ legendItems } orientation="horizontal" />
		</div>
	);
};

export const WithLineChart: Story = {
	render: () => <WithLineChartData />,
	parameters: {
		docs: {
			description: {
				story: 'Legend used with LineChart data, positioned independently below the chart.',
			},
		},
	},
};

// Story showing use with BarChart data
const WithBarChartData = () => {
	const theme = useChartTheme();
	const legendItems = useChartLegendData( barChartData, theme );

	return (
		<div style={ { display: 'flex', gap: '20px', alignItems: 'flex-start' } }>
			<BarChart data={ barChartData } showLegend={ false } width={ 400 } height={ 300 } />
			<Legend items={ legendItems } orientation="vertical" />
		</div>
	);
};

export const WithBarChart: Story = {
	render: () => <WithBarChartData />,
	parameters: {
		docs: {
			description: {
				story: 'Legend used with BarChart data, positioned vertically beside the chart.',
			},
		},
	},
};

// Story showing standalone legend using chartId to automatically get data from context
const StandaloneLegendWithChartIdComponent = () => {
	return (
		<ChartProvider>
			<div style={ { display: 'flex', flexDirection: 'column', gap: '20px' } }>
				{ /* Chart with legend hidden but still registering data */ }
				<LineChart
					chartId="standalone-legend-chart"
					data={ lineChartData }
					showLegend={ false }
					width={ 400 }
					height={ 200 }
					withGradientFill={ false }
					withLegendGlyph={ false }
				/>
				{ /* Standalone legend that automatically gets data from chart context */ }
				<Legend chartId="standalone-legend-chart" orientation="horizontal" />
			</div>
		</ChartProvider>
	);
};

export const StandaloneLegendWithChartId: Story = {
	render: () => <StandaloneLegendWithChartIdComponent />,
	parameters: {
		docs: {
			description: {
				story: `
## Standalone Legend with Chart Context Integration

This example demonstrates the power of the Legend component's context integration feature.

### How It Works

1. **Chart Registration**: When a chart is rendered with a \`chartId\`, it automatically registers its legend data in the chart context
2. **Data Retrieval**: The Legend component can then retrieve this data using the same \`chartId\`
3. **Decoupled Display**: The legend can be placed anywhere in your layout, completely independent from the chart

### Key Benefits

- **Flexible Layouts**: Create complex dashboard layouts with centralized legend areas
- **Consistent Legends**: Multiple charts can share legend styles and positioning
- **Dynamic Updates**: Legend automatically updates when chart data changes
- **No Prop Drilling**: No need to pass legend data through multiple component levels

### Code Example

\`\`\`jsx
// Chart with hidden legend
<LineChart
  chartId="standalone-legend-chart"
  data={lineChartData}
  showLegend={false}
  width={400}
  height={200}
/>

// Standalone legend that retrieves data automatically
<Legend 
  chartId="standalone-legend-chart" 
  orientation="horizontal" 
/>
\`\`\`

### Important Notes

- The chart and legend must be wrapped in the same ChartProvider context
- The \`chartId\` must match exactly between chart and legend
- Charts with \`showLegend={false}\` still register their legend data
- If no chart with the given \`chartId\` exists, the legend will render nothing
`,
			},
		},
	},
};

// Story showing a real-world dashboard layout with centralized legends
const DashboardWithCentralizedLegend = () => {
	return (
		<ChartProvider>
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: '1fr 300px',
					gap: '20px',
					padding: '20px',
					backgroundColor: '#f5f5f5',
					borderRadius: '8px',
				} }
			>
				{ /* Main content area with charts */ }
				<div style={ { display: 'flex', flexDirection: 'column', gap: '20px' } }>
					<div style={ { backgroundColor: 'white', padding: '20px', borderRadius: '4px' } }>
						<h3 style={ { margin: '0 0 20px 0' } }>Revenue Trends</h3>
						<LineChart
							chartId="dashboard-revenue"
							data={ lineChartData }
							showLegend={ false }
							width={ 600 }
							height={ 200 }
							withGradientFill={ false }
							withLegendGlyph={ false }
						/>
					</div>

					<div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' } }>
						<div style={ { backgroundColor: 'white', padding: '20px', borderRadius: '4px' } }>
							<h3 style={ { margin: '0 0 20px 0' } }>Sales by Quarter</h3>
							<BarChart
								chartId="dashboard-sales"
								data={ barChartData }
								showLegend={ false }
								width={ 280 }
								height={ 200 }
							/>
						</div>

						<div style={ { backgroundColor: 'white', padding: '20px', borderRadius: '4px' } }>
							<h3 style={ { margin: '0 0 20px 0' } }>Device Distribution</h3>
							<PieChart
								chartId="dashboard-devices"
								data={ pieChartData }
								showLegend={ false }
								width={ 200 }
								height={ 200 }
							/>
						</div>
					</div>
				</div>

				{ /* Centralized legend panel */ }
				<aside style={ { backgroundColor: 'white', padding: '20px', borderRadius: '4px' } }>
					<h3 style={ { margin: '0 0 20px 0' } }>Legend</h3>

					<div style={ { marginBottom: '20px' } }>
						<h4
							style={ {
								margin: '0 0 10px 0',
								fontSize: '14px',
								color: '#666',
							} }
						>
							Revenue Trends
						</h4>
						<Legend chartId="dashboard-revenue" orientation="vertical" />
					</div>

					<div style={ { marginBottom: '20px' } }>
						<h4
							style={ {
								margin: '0 0 10px 0',
								fontSize: '14px',
								color: '#666',
							} }
						>
							Sales by Quarter
						</h4>
						<Legend chartId="dashboard-sales" orientation="vertical" />
					</div>

					<div>
						<h4
							style={ {
								margin: '0 0 10px 0',
								fontSize: '14px',
								color: '#666',
							} }
						>
							Device Distribution
						</h4>
						<Legend chartId="dashboard-devices" orientation="vertical" />
					</div>
				</aside>
			</div>
		</ChartProvider>
	);
};

export const DashboardExample: Story = {
	render: () => <DashboardWithCentralizedLegend />,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				story: `
## Real-World Dashboard Example

This example demonstrates a complete dashboard implementation using Legend with chart context integration.

### Key Implementation Details

1. **Chart Setup**: Each chart has a unique \`chartId\` and \`showLegend={false}\`
2. **Centralized Legends**: All legends are placed in a dedicated sidebar
3. **Automatic Data Sync**: Legends automatically retrieve data from their respective charts
4. **Clean Layout**: Charts remain uncluttered while legends are easily accessible

### Benefits of This Approach

- **Consistent Legend Styling**: All legends share the same visual style
- **Space Efficiency**: Charts can use full width without legend taking up space
- **Better Mobile Experience**: Legends can be collapsed or repositioned on smaller screens
- **Easier Maintenance**: Legend updates only need to happen in one place

### Implementation Code

\`\`\`jsx
// Charts with hidden legends
<LineChart chartId="dashboard-revenue" data={revenueData} showLegend={false} />
<BarChart chartId="dashboard-sales" data={salesData} showLegend={false} />
<PieChart chartId="dashboard-devices" data={deviceData} showLegend={false} />

// Centralized legend panel
<aside>
  <Legend chartId="dashboard-revenue" orientation="vertical" />
  <Legend chartId="dashboard-sales" orientation="vertical" />
  <Legend chartId="dashboard-devices" orientation="vertical" />
</aside>
\`\`\`
`,
			},
		},
	},
};

// Story showing different alignment options
export const AlignmentOptions: Story = {
	args: {
		items: [
			{ label: 'Series 1', value: '25%', color: '#3858E9' },
			{ label: 'Series 2', value: '35%', color: '#80C8FF' },
			{ label: 'Series 3', value: '40%', color: '#44B556' },
		],
		orientation: 'horizontal',
		alignmentHorizontal: 'left',
		alignmentVertical: 'top',
	},
	parameters: {
		docs: {
			description: {
				story: 'Legend with custom alignment options.',
			},
		},
	},
};

// Story showing the legend with custom shapes
export const CustomShape: Story = {
	args: {
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
		],
		orientation: 'horizontal',
		shape: 'circle',
	},
	parameters: {
		docs: {
			description: {
				story: 'Legend with circle shape instead of default rectangle.',
			},
		},
	},
};
