import { GlobalChartsProvider } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import { legendArgTypes } from '../../../stories/legend-config';
import { osUsageData as data } from '../../../stories/sample-data';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { PieChart } from '../index';
import { PieChartUnresponsive } from '../pie-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof PieChart > > & {
	labelTextColor?: string;
	labelBackgroundColor?: string;
};

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Pie Chart',
	component: PieChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		...legendArgTypes,
		size: {
			control: {
				type: 'range',
				min: 100,
				max: 800,
				step: 10,
				default: 400,
			},
			description: 'Diameter of the pie chart in pixels',
			table: { category: 'Dimensions' },
		},
		thickness: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			description: 'Thickness of the pie (1 = full pie, <1 = donut)',
			table: { category: 'Visual Style' },
		},
		padding: {
			control: {
				type: 'range',
				min: 0,
				max: 100,
				step: 1,
			},
			description: 'Internal padding around the chart',
			table: { category: 'Dimensions' },
		},
		gapScale: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			description: 'Scale of gaps between segments (0 = no gaps)',
			table: { category: 'Visual Style' },
		},
		cornerScale: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			description: 'Scale of rounded corners on segments (0 = sharp corners)',
			table: { category: 'Visual Style' },
		},
		labelTextColor: {
			control: { type: 'color' },
			description: 'Color of the label text displayed on pie chart segments',
			table: { category: 'Labels' },
		},
		labelBackgroundColor: {
			control: { type: 'color' },
			description: 'Background color for labels displayed on pie chart segments',
			table: { category: 'Labels' },
		},
		showLabels: {
			control: 'boolean',
			description: 'Show or hide labels on pie segments',
			table: { category: 'Labels' },
		},
	},
	render: ( { labelTextColor, labelBackgroundColor, ...chartProps } ) => {
		const ChartComponent = <PieChart { ...chartProps } />;

		if ( labelTextColor || labelBackgroundColor ) {
			return (
				<GlobalChartsProvider
					theme={ {
						labelTextColor,
						labelBackgroundColor,
					} }
				>
					{ ChartComponent }
				</GlobalChartsProvider>
			);
		}

		return ChartComponent;
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		thickness: 1,
		gapScale: 0,
		cornerScale: 0,
		withTooltips: false,
		data,
		resize: 'none',
		size: 400,
		containerWidth: '432px',
		containerHeight: '432px',
	},
};

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
	},
};

export const WithTooltips: Story = {
	args: {
		...Default.args,
		withTooltips: true,
	},
	parameters: {
		docs: {
			description: {
				story: 'Pie chart with interactive tooltips that appear on hover.',
			},
		},
	},
};

export const WithLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
		containerHeight: '500px',
	},
};

export const WithCompositionLegend: Story = {
	render: args => (
		<div
			style={ {
				display: 'grid',
				gap: '2rem',
				gridTemplateColumns: 'repeat(2, 1fr)',
				alignItems: 'center',
			} }
		>
			<div>
				<h3>Traditional Props-based Legend</h3>
				<PieChart
					size={ 300 }
					data={ args.data }
					showLegend={ true }
					legendPosition={ args.legendPosition || 'bottom' }
					legendOrientation={ args.legendOrientation || 'horizontal' }
					legendAlignment={ args.legendAlignment || 'center' }
					legendMaxWidth={ args.legendMaxWidth }
					legendTextOverflow={ args.legendTextOverflow || 'wrap' }
					legendValueDisplay={ args.legendValueDisplay }
				/>
			</div>
			<div>
				<h3>Composition API with Legend Component</h3>
				<PieChart size={ 300 } data={ args.data } legendValueDisplay={ args.legendValueDisplay }>
					<PieChart.Legend
						position={ args.legendPosition || 'bottom' }
						orientation={ args.legendOrientation || 'horizontal' }
						alignment={ args.legendAlignment || 'center' }
						maxWidth={ args.legendMaxWidth }
						textOverflow={ args.legendTextOverflow || 'wrap' }
					/>
				</PieChart>
			</div>
		</div>
	),
	args: {
		data,
		containerHeight: '500px',
	},
	argTypes: {
		legendInteractive: {
			table: { disable: true },
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates the new composition API allowing flexible component composition. The chart can be used with traditional props or with explicit child components for more control.',
			},
		},
	},
};

export const InteractiveLegend: Story = {
	render: args => (
		<GlobalChartsProvider>
			<div style={ { padding: '20px' } }>
				<h3>Interactive Legend</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Click legend items to show/hide segments. Percentages recalculate automatically for
					visible segments.
				</p>
				<PieChartUnresponsive
					chartId="interactive-pie-chart"
					size={ args.size || 400 }
					data={ args.data }
					showLegend={ true }
					legendInteractive={ true }
					legendPosition={ args.legendPosition || 'bottom' }
					legendOrientation={ args.legendOrientation || 'horizontal' }
					legendAlignment={ args.legendAlignment || 'center' }
					legendValueDisplay={ args.legendValueDisplay }
				/>
			</div>
		</GlobalChartsProvider>
	),
	args: {
		data,
		size: 400,
		containerHeight: '600px',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive legends allow users to toggle segment visibility by clicking legend items. When segments are hidden, the visible segments are recalculated to total 100%. Requires chartId and GlobalChartsProvider.',
			},
		},
	},
};

export const CustomLegendPositioning: Story = {
	args: {
		data: [
			{
				label: 'Desktop',
				value: 45000,
				valueDisplay: '45K',
				percentage: 45,
			},
			{
				label: 'Mobile',
				value: 35000,
				valueDisplay: '35K',
				percentage: 35,
			},
			{
				label: 'Tablet',
				value: 20000,
				valueDisplay: '20K',
				percentage: 20,
			},
		],
		thickness: 1, // Full pie chart
		gapScale: 0.03,
		padding: 20,
		cornerScale: 0.03,
		withTooltips: true,
		showLegend: true,
		legendOrientation: 'vertical',
		legendAlignment: 'center',
		legendPosition: 'top',
		legendShape: 'circle',
		size: 400,
		containerWidth: '432px',
		containerHeight: '480px',
		resize: 'none',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Pie chart with top-end positioned vertical legend. This demonstrates non-default legend positioning to showcase different legend placement possibilities with device usage data.',
			},
		},
	},
};

const responsiveArgs = { ...Default.args, resize: 'both' as const };
delete responsiveArgs.size;
export const Responsiveness: Story = {
	args: responsiveArgs,
	parameters: {
		docs: {
			description: {
				story: 'Pie chart with responsive behavior. Uses size prop instead of width/height.',
			},
		},
	},
};

export const CompositionAPI: Story = {
	render: args => {
		const chartData = args.data || [
			{ label: 'Desktop', value: 45, percentage: 45 },
			{ label: 'Mobile', value: 30, percentage: 30 },
			{ label: 'Tablet', value: 25, percentage: 25 },
		];

		return (
			<PieChartUnresponsive
				data={ chartData }
				size={ 400 }
				withTooltips={ true }
				thickness={ 0.7 }
				legendValueDisplay={ args.legendValueDisplay || 'value' }
			>
				<PieChartUnresponsive.HTML>
					<h3 style={ { textAlign: 'center', marginBottom: '20px' } }>Device Usage Distribution</h3>
				</PieChartUnresponsive.HTML>

				<PieChartUnresponsive.SVG>
					<text
						x={ 0 }
						y={ 0 }
						textAnchor="middle"
						style={ { fontSize: '24px', fontWeight: 'bold' } }
					>
						100%
					</text>
					<text x={ 0 } y={ 20 } textAnchor="middle" style={ { fontSize: '14px', fill: '#666' } }>
						Total Users
					</text>
				</PieChartUnresponsive.SVG>

				<PieChartUnresponsive.HTML>
					<PieChartUnresponsive.Legend
						position="bottom"
						orientation="horizontal"
						alignment="center"
					/>
					<div
						style={ {
							marginTop: '20px',
							padding: '10px',
							backgroundColor: '#f5f5f5',
							borderRadius: '4px',
							fontSize: '14px',
							color: '#666',
						} }
					>
						<p style={ { margin: 0 } }>
							This example demonstrates the composition API where you can add:
						</p>
						<ul style={ { margin: '5px 0 0 20px', padding: 0 } }>
							<li>SVG elements inside the chart using PieChart.SVG</li>
							<li>HTML elements outside the chart using PieChart.HTML</li>
							<li>Mix regular children with compound components</li>
						</ul>
					</div>
				</PieChartUnresponsive.HTML>
			</PieChartUnresponsive>
		);
	},
	args: {
		data,
		containerHeight: '700px',
		containerWidth: '600px',
	},
	argTypes: {
		legendInteractive: {
			table: { disable: true },
		},
	},
	parameters: {
		docs: {
			description: {
				story: `Demonstrates the compound component pattern for PieChart composition.

Use \`<PieChart.SVG>\` to add custom SVG elements inside the chart area, and \`<PieChart.HTML>\` to add HTML elements outside the SVG.

This pattern provides:
- Clear intent about where children should render
- Type safety for different content types
- Flexibility to extend the chart with custom elements
- Backward compatibility with existing implementations`,
			},
		},
	},
};

export const CustomLabelColors: Story = {
	args: {
		...Default.args,
		showLegend: true,
		thickness: 0.85, // Slightly thinner for better label visibility
		data: [
			{
				label: 'Desktop',
				value: 45000,
				valueDisplay: '45K',
				percentage: 45,
				color: '#FF6B6B', // Light red segment
			},
			{
				label: 'Mobile',
				value: 35000,
				valueDisplay: '35K',
				percentage: 35,
				color: '#4ECDC4', // Light teal segment
			},
			{
				label: 'Tablet',
				value: 20000,
				valueDisplay: '20K',
				percentage: 20,
				color: '#45B7D1', // Light blue segment
			},
		],
		labelTextColor: '#FFFFFF', // White text for contrast against dark background
		labelBackgroundColor: 'rgba(0, 0, 0, 0.75)', // Dark semi-transparent background
		size: 400,
		containerHeight: '500px',
	},
	parameters: {
		docs: {
			description: {
				story: `This example demonstrates how to enable label backgrounds for enhanced readability. By default, labels have no background (transparent) to preserve the original chart appearance, but you can add backgrounds when needed.

**Key Features:**
- **labelTextColor**: White text (\`#FFFFFF\`) for contrast against dark background
- **labelBackgroundColor**: Dark semi-transparent background (\`rgba(0, 0, 0, 0.75)\`) - disabled by default
- **Custom segment colors**: Bright colors that would make default dark text hard to read
- **Opt-in enhancement**: Backgrounds only appear when explicitly set

Use the Storybook controls to experiment with different combinations. Try setting labelBackgroundColor to \`transparent\` to see the default behavior.`,
			},
		},
	},
};

export const ErrorStates: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Empty Data</h3>
				<PieChart size={ 300 } data={ [] } />
			</div>
			<div>
				<h3>Invalid Percentage Total</h3>
				<PieChart
					size={ 300 }
					data={ [
						{ label: 'A', value: 30, percentage: 30 },
						{ label: 'B', value: 40, percentage: 40 },
					] } // Only adds up to 70%
				/>
			</div>
			<div>
				<h3>Negative Values</h3>
				<PieChart
					size={ 300 }
					data={ [
						{ label: 'A', value: -30, percentage: -30 },
						{ label: 'B', value: 130, percentage: 130 },
					] }
				/>
			</div>
			<div>
				<h3>Single Data Point</h3>
				<PieChart size={ 300 } data={ [ { label: 'A', value: 100, percentage: 100 } ] } />
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Examples of how the pie chart handles various error states and edge cases.',
			},
		},
	},
};
