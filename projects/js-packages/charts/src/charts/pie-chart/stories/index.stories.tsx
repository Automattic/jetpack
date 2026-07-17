import { GlobalChartsProvider } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import {
	extractLegendConfig,
	legendArgTypes,
	type LegendStoryControls,
} from '../../../stories/legend-config';
import { osUsageData as data } from '../../../stories/sample-data';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { PieChart } from '../index';
import { PieChartUnresponsive } from '../pie-chart';
import type { ChartLegendConfig, DataPointPercentage } from '../../../types';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof PieChart > > &
	LegendStoryControls & {
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
		legendValueDisplay: {
			control: { type: 'select' as const },
			options: [ 'percentage', 'value', 'valueDisplay', 'none' ],
			table: { category: 'Legend' },
			description:
				'What type of value to display in the legend when showValues is true. Note: Enable "showLegend" to see the effect of this control.',
		},
		size: {
			control: {
				type: 'range',
				min: 100,
				max: 800,
				step: 10,
				default: 400,
			},
			description:
				'Maximum diameter of the pie in pixels. The pie shrinks if the container is smaller. When omitted, fills available space.',
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
		const legend = extractLegendConfig< ChartLegendConfig< DataPointPercentage[] > >( chartProps );
		const ChartComponent = <PieChart { ...chartProps } legend={ legend } />;

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
		containerWidth: '432px',
		containerHeight: '432px',
	},
};

export const WithSize: Story = {
	args: {
		...Default.args,
		size: 200,
	},
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 300,
		height: 300,
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
	},
	parameters: {
		docs: {
			description: {
				story:
					'Props-based legend using `showLegend` and the `legend` config object. Use Storybook controls to adjust legend position, alignment, orientation, shape, and interactivity.',
			},
		},
	},
};

export const WithCompositionLegend: Story = {
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< DataPointPercentage[] > >( args );
		return (
			<PieChart
				{ ...args }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-pie-chart"
			>
				<PieChart.Legend { ...legend } />
			</PieChart>
		);
	},
	args: {
		data,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Composition API using `<PieChart.Legend />` as a child component for explicit legend placement and configuration. This is the recommended approach for flexible legend positioning.',
			},
		},
	},
};

export const CompositionAPI: Story = {
	render: args => {
		const chartData = args.data || [
			{ label: 'Desktop', value: 45 },
			{ label: 'Mobile', value: 30 },
			{ label: 'Tablet', value: 25 },
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
				color: '#FF6B6B', // Light red segment
			},
			{
				label: 'Mobile',
				value: 35000,
				valueDisplay: '35K',
				color: '#4ECDC4', // Light teal segment
			},
			{
				label: 'Tablet',
				value: 20000,
				valueDisplay: '20K',
				color: '#45B7D1', // Light blue segment
			},
		],
		labelTextColor: '#FFFFFF', // White text for contrast against dark background
		labelBackgroundColor: 'rgba(0, 0, 0, 0.75)', // Dark semi-transparent background
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
				<PieChart height={ 300 } data={ [] } />
			</div>
			<div>
				<h3>Negative Values</h3>
				<PieChart
					height={ 300 }
					data={ [
						{ label: 'A', value: -30 },
						{ label: 'B', value: 130 },
					] }
				/>
			</div>
			<div>
				<h3>Single Data Point</h3>
				<PieChart height={ 300 } data={ [ { label: 'A', value: 100 } ] } />
			</div>
		</div>
	),
	args: {
		containerHeight: '600px',
	},
	parameters: {
		docs: {
			description: {
				story: 'Examples of how the pie chart handles various error states and edge cases.',
			},
		},
	},
};
