import { Meta, StoryObj } from '@storybook/react';
import { simpleChartDecorator, ChartStoryArgs, themeArgTypes } from '../../../stories';
import { BarChart } from '../../bar-chart';
import { LineChart } from '../../line-chart';
import { PieChart } from '../../pie-chart';
import { useChartLegendItems } from '../hooks/use-chart-legend-items';
import { Legend } from '../legend';
import type { SeriesData, DataPointPercentage } from '../../../types';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof Legend > >;

const meta: Meta< StoryArgs > = {
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
  alignment="end"
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
	decorators: [ simpleChartDecorator ],
	argTypes: {
		...themeArgTypes,
	},
};

export default meta;
type Story = StoryObj< StoryArgs >;

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
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, ...legendProps } = args;
		return <Legend { ...legendProps } />;
	},
	args: {
		items: [
			{ label: 'Desktop', value: '65%', color: '#3858E9' },
			{ label: 'Mobile', value: '35%', color: '#80C8FF' },
		],
		orientation: 'horizontal',
	},
};

export const Vertical: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, ...legendProps } = args;
		return <Legend { ...legendProps } />;
	},
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
	const legendItems = useChartLegendItems( lineChartData, {
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
			<Legend items={ legendItems } orientation="horizontal" shape="line" />
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
	const legendItems = useChartLegendItems( barChartData );

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
			<Legend chartId="standalone-legend-chart" orientation="horizontal" shape="line" />
		</div>
	);
};

export const StandaloneLegendWithChartId: Story = {
	render: () => <StandaloneLegendWithChartIdComponent />,
	parameters: {
		docs: {
			source: {
				code: `<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
  {/* Chart with legend hidden but still registering data */}
  <LineChart
    chartId="standalone-legend-chart"
    data={lineChartData}
    showLegend={false}
    width={400}
    height={200}
  />
  {/* Standalone legend that automatically gets data from chart context */}
  <Legend chartId="standalone-legend-chart" orientation="horizontal" />
</div>`,
			},
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

- The chart and legend must be wrapped in the same GlobalChartsProvider context
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
						<PieChart chartId="dashboard-devices" data={ pieChartData } showLegend={ false } />
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
					<Legend chartId="dashboard-revenue" orientation="vertical" shape="line" />
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
					<Legend chartId="dashboard-devices" orientation="vertical" shape="circle" />
				</div>
			</aside>
		</div>
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
		alignment: 'start',
	},
	parameters: {
		docs: {
			description: {
				story: 'Legend with custom alignment options.',
			},
		},
	},
};

// Comprehensive story showing all text overflow and wrapping features
export const TextOverflow: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, maxWidth, ...restProps } = args;
		const containerStyle =
			args.orientation === 'horizontal'
				? { width: '600px', border: '1px solid #ddd', padding: '20px' }
				: { width: '350px', border: '1px solid #ddd', padding: '20px' };

		const titleText = maxWidth
			? `Legend with ${
					args.textOverflow === 'ellipsis' ? 'Ellipsis' : 'Text Wrapping'
			  } (maxWidth: ${ maxWidth })`
			: 'Legend without maxWidth constraint';

		return (
			<div style={ containerStyle }>
				<h4 style={ { marginBottom: '10px' } }>{ titleText }</h4>
				<Legend { ...restProps } maxWidth={ maxWidth } />
			</div>
		);
	},
	args: {
		items: [
			{
				label: 'Very Long Legend Item Label That Demonstrates Text Overflow Behavior',
				value: '25%',
				color: '#3858E9',
			},
			{
				label: 'Another Extremely Long Label for Testing Different Display Options',
				value: '35%',
				color: '#80C8FF',
			},
			{ label: 'Short Label', value: '15%', color: '#44B556' },
			{ label: 'Medium Length Label Text', value: '25%', color: '#FFC107' },
		],
		orientation: 'horizontal',
		maxWidth: 150,
		textOverflow: 'wrap',
		position: 'bottom',
		alignment: 'center',
	},
	argTypes: {
		orientation: {
			control: { type: 'radio' },
			options: [ 'horizontal', 'vertical' ],
			description: 'Legend orientation',
		},
		maxWidth: {
			control: { type: 'range', min: 0, max: 300, step: 10 },
			description: 'Maximum width for legend items (pixels). Set to 0 to disable.',
			table: {
				type: { summary: 'number | string | undefined' },
				defaultValue: { summary: 'undefined' },
			},
		},
		textOverflow: {
			control: { type: 'radio' },
			options: [ 'wrap', 'ellipsis' ],
			description: 'Text overflow behavior when maxWidth is set',
		},
		position: {
			control: { type: 'radio' },
			options: [ 'top', 'bottom' ],
			description: 'Vertical position of the legend',
		},
		alignment: {
			control: { type: 'radio' },
			options: [ 'start', 'center', 'end' ],
			description: 'Horizontal alignment of the legend',
		},
	},
	parameters: {
		docs: {
			description: {
				story: `
## Text Overflow and Wrapping

This interactive story demonstrates all the text overflow and wrapping features of the Legend component.

### Features

- **Text Overflow Modes**:
  - **Wrap** (default): Text wraps naturally to multiple lines when it exceeds maxWidth
  - **Ellipsis**: Truncates text with ellipsis (...) and shows tooltip on hover

- **Orientation**: Switch between horizontal and vertical layouts
- **Max Width**: Adjust the maximum width constraint with the slider (50-300px)
- **Position & Alignment**: Control legend placement

### Use Cases

- **Widgets/Dashboards**: Use ellipsis mode with small maxWidth values
- **Full Displays**: Use wrap mode with larger maxWidth values
- **Mobile**: Use vertical orientation with appropriate maxWidth

### Accessibility
When using ellipsis mode, truncated text automatically includes a \`title\` attribute for screen readers and displays a native tooltip on hover showing the complete text.

Try different combinations using the controls above to see how the legend adapts to various constraints!
`,
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

// New Grid Layout Stories
export const GridLayoutAuto: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, ...legendProps } = args;
		return (
			<div style={ { width: '500px', border: '1px solid #ddd', padding: '20px' } }>
				<h4 style={ { marginBottom: '10px' } }>Grid Layout - Auto Fit</h4>
				<Legend { ...legendProps } />
			</div>
		);
	},
	args: {
		items: [
			{ label: 'North America', value: '35%', color: '#3858E9' },
			{ label: 'Europe', value: '28%', color: '#80C8FF' },
			{ label: 'Asia Pacific', value: '22%', color: '#44B556' },
			{ label: 'Latin America', value: '10%', color: '#FFC107' },
			{ label: 'Middle East & Africa', value: '5%', color: '#FF5722' },
		],
		layout: 'grid',
		gridTemplate: 'auto',
		shape: 'circle',
	},
	parameters: {
		docs: {
			description: {
				story: 'Grid layout with auto-fit columns that adapt based on content width.',
			},
		},
	},
};

export const GridLayoutColumns: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, ...legendProps } = args;
		return (
			<div style={ { width: '600px', border: '1px solid #ddd', padding: '20px' } }>
				<h4 style={ { marginBottom: '10px' } }>Grid Layout - 3 Columns</h4>
				<Legend { ...legendProps } />
			</div>
		);
	},
	args: {
		items: [
			{ label: 'Q1 Sales', value: '12M', color: '#3858E9' },
			{ label: 'Q2 Sales', value: '15M', color: '#80C8FF' },
			{ label: 'Q3 Sales', value: '18M', color: '#44B556' },
			{ label: 'Q4 Sales', value: '22M', color: '#FFC107' },
			{ label: 'Annual Total', value: '67M', color: '#FF5722' },
			{ label: 'Previous Year', value: '52M', color: '#9C27B0' },
		],
		layout: 'grid',
		gridTemplate: 'columns',
		gridColumns: 3,
		shape: 'rect',
	},
	parameters: {
		docs: {
			description: {
				story: 'Grid layout with fixed 3-column structure, perfect for organized data display.',
			},
		},
	},
};

export const GridLayoutCompact: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, ...legendProps } = args;
		return (
			<div style={ { width: '400px', border: '1px solid #ddd', padding: '20px' } }>
				<h4 style={ { marginBottom: '10px' } }>Grid Layout - Compact</h4>
				<Legend { ...legendProps } />
			</div>
		);
	},
	args: {
		items: [
			{ label: 'Chrome', value: '64%', color: '#4285F4' },
			{ label: 'Safari', value: '18%', color: '#34A853' },
			{ label: 'Edge', value: '9%', color: '#EA4335' },
			{ label: 'Firefox', value: '6%', color: '#FBBC04' },
			{ label: 'Other', value: '3%', color: '#9AA0A6' },
		],
		layout: 'grid',
		gridTemplate: 'compact',
		gridGap: '4px',
		shape: 'circle',
	},
	parameters: {
		docs: {
			description: {
				story: 'Compact grid layout with minimal spacing, ideal for space-constrained designs.',
			},
		},
	},
};

// Custom render functions defined outside components to avoid arrow functions in JSX
const customRenderLegendItem = ( item, index, theme ) => (
			<div
				key={ index }
				style={ {
					display: 'flex',
					alignItems: 'center',
					padding: '8px 12px',
					backgroundColor: theme.backgroundColor || '#f8f9fa',
					border: `2px solid ${ item.color }`,
					borderRadius: '8px',
					marginBottom: '8px',
				} }
			>
				<div
					style={ {
						width: '12px',
						height: '12px',
						backgroundColor: item.color,
						borderRadius: '50%',
						marginRight: '8px',
					} }
				/>
				<span style={ { fontWeight: 'bold', color: theme.legendLabelStyles?.color || '#333' } }>
					{ item.label }
				</span>
				{ item.value && (
					<span style={ { marginLeft: 'auto', color: '#666' } }>{ item.value }</span>
				) }
			</div>
		);

		return (
			<div style={ { width: '300px' } }>
				<h4 style={ { marginBottom: '10px' } }>Custom Legend Item Rendering</h4>
				<Legend { ...legendProps } renderLegendItem={ customRenderLegendItem } />
			</div>
		);
	},
	args: {
		items: [
			{ label: 'Primary', value: '45%', color: '#3858E9' },
			{ label: 'Secondary', value: '30%', color: '#80C8FF' },
			{ label: 'Tertiary', value: '25%', color: '#44B556' },
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					'Legend with custom item rendering that creates card-like legend items with borders and custom styling.',
			},
		},
	},
};

export const CustomRenderEntireLegend: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, ...legendProps } = args;

		const customRenderLegend = ( items, theme ) => (
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: 'repeat(2, 1fr)',
					gap: '16px',
					padding: '16px',
					backgroundColor: theme.backgroundColor || '#f8f9fa',
					border: '1px solid #e9ecef',
					borderRadius: '8px',
				} }
			>
				<div
					style={ {
						gridColumn: '1 / -1',
						fontWeight: 'bold',
						color: theme.legendLabelStyles?.color || '#333',
					} }
				>
					Revenue by Category
				</div>
				{ items.map( ( item, index ) => (
					<div key={ index } style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
						<div
							style={ {
								width: '16px',
								height: '16px',
								backgroundColor: item.color,
								borderRadius: '3px',
							} }
						/>
						<div style={ { flex: 1 } }>
							<div
								style={ {
									fontSize: '14px',
									fontWeight: 'medium',
									color: theme.legendLabelStyles?.color || '#333',
								} }
							>
								{ item.label }
							</div>
							<div style={ { fontSize: '12px', color: '#666' } }>{ item.value }</div>
						</div>
					</div>
				) ) }
			</div>
		);

		return (
			<div style={ { width: '400px' } }>
				<h4 style={ { marginBottom: '10px' } }>Custom Entire Legend Rendering</h4>
				<Legend { ...legendProps } renderLegend={ customRenderLegend } />
			</div>
		);
	},
	args: {
		items: [
			{ label: 'Product Sales', value: '$2.4M', color: '#3858E9' },
			{ label: 'Services', value: '$1.8M', color: '#80C8FF' },
			{ label: 'Subscriptions', value: '$950K', color: '#44B556' },
			{ label: 'Partnerships', value: '$620K', color: '#FFC107' },
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					'Complete custom legend rendering with a grid layout, title, and custom styling that replaces the entire default legend structure.',
			},
		},
	},
};

// Woo Analytics inspired grid layout
export const WooAnalyticsStyle: Story = {
	render: args => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { themeName, ...legendProps } = args;

		const wooStyleRenderLegendItem = ( item, index, theme ) => (
			<div
				key={ index }
				style={ {
					display: 'flex',
					alignItems: 'center',
					padding: '12px',
					backgroundColor: '#fff',
					border: '1px solid #e2e4e7',
					borderRadius: '4px',
					fontSize: '13px',
				} }
			>
				<div
					style={ {
						width: '14px',
						height: '14px',
						backgroundColor: item.color,
						borderRadius: '2px',
						marginRight: '8px',
						flexShrink: 0,
					} }
				/>
				<div style={ { flex: 1, minWidth: 0 } }>
					<div style={ { fontWeight: '500', color: '#1e1e1e', marginBottom: '2px' } }>
						{ item.label }
					</div>
					{ item.value && (
						<div style={ { color: '#757575', fontSize: '12px' } }>{ item.value }</div>
					) }
				</div>
			</div>
		);

		return (
			<div style={ { maxWidth: '600px' } }>
				<h4 style={ { marginBottom: '16px', color: '#1e1e1e' } }>
					WooCommerce Analytics Style Legend
				</h4>
				<Legend
					{ ...legendProps }
					layout="grid"
					gridTemplate="columns"
					gridColumns={ 3 }
					gridGap="12px"
					renderLegendItem={ wooStyleRenderLegendItem }
				/>
			</div>
		);
	},
	args: {
		items: [
			{ label: 'Product A', value: '$24,580', color: '#3858E9' },
			{ label: 'Product B', value: '$18,420', color: '#7B90FF' },
			{ label: 'Product C', value: '$15,920', color: '#66BDFF' },
			{ label: 'Product D', value: '$12,350', color: '#873EFF' },
			{ label: 'Product E', value: '$9,680', color: '#EB6594' },
			{ label: 'Other Products', value: '$8,450', color: '#9AA0A6' },
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					'Legend styled to match WooCommerce Analytics patterns with grid layout, cards, and WooCommerce color palette. This demonstrates how to solve the original issue of creating custom legend layouts with proper theme synchronization.',
			},
		},
	},
};
