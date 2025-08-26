import { jetpackTheme, wooTheme } from '../../../providers/theme';
import { sharedDecorator } from '../../../stories/decorator-config';
import { legendArgTypes } from '../../../stories/legend-config';
import { osUsageData as data } from '../../../stories/sample-data';
import { PieChart } from '../index';
import { PieChartUnresponsive } from '../pie-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = React.ComponentProps< typeof PieChart > & {
	theme?: string | object;
	resize?: string;
	containerWidth?: string;
	containerHeight?: string;
};

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Pie Chart',
	component: PieChart,
	parameters: {
		layout: 'centered',
	},
	decorators: sharedDecorator,
	argTypes: {
		...legendArgTypes,
		size: {
			control: {
				type: 'range',
				min: 100,
				max: 800,
				step: 10,
				default: 400,
			},
		},
		thickness: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		padding: {
			control: {
				type: 'range',
				min: 0,
				max: 100,
				step: 1,
			},
		},
		gapScale: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		cornerScale: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		theme: {
			control: { type: 'select' as const },
			options: [ 'default', 'jetpack', 'woo' ],
			mapping: {
				default: undefined,
				jetpack: jetpackTheme,
				woo: wooTheme,
			},
			defaultValue: 'default',
		},
		maxWidth: {
			control: {
				type: 'number',
				min: 100,
				max: 1200,
			},
		},
		aspectRatio: {
			control: {
				type: 'number',
				min: 0,
				max: 1,
			},
		},
		resizeDebounceTime: {
			control: {
				type: 'number',
				min: 0,
				max: 10000,
			},
		},
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		thickness: 1,
		gapScale: 0,
		padding: 20,
		cornerScale: 0,
		withTooltips: false,
		data,
		theme: 'default',
		resize: 'none',
		size: 400,
		containerWidth: '432px',
		containerHeight: '432px',
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
};

export const WithCompositionLegend: Story = {
	render: () => (
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
					data={ data }
					showLegend={ true }
					legendPosition="bottom"
					legendOrientation="horizontal"
				/>
			</div>
			<div>
				<h3>Composition API with Legend Component</h3>
				<PieChart size={ 300 } data={ data }>
					<PieChart.Legend position="bottom" orientation="horizontal" alignment="center" />
				</PieChart>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates the new composition API allowing flexible component composition. The chart can be used with traditional props or with explicit child components for more control.',
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

const responsiveArgs = { ...Default.args, resize: 'both' };
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
	render: () => {
		const chartData = [
			{ label: 'Desktop', value: 45, percentage: 45 },
			{ label: 'Mobile', value: 30, percentage: 30 },
			{ label: 'Tablet', value: 25, percentage: 25 },
		];

		return (
			<div style={ { width: '600px', padding: '20px' } }>
				<PieChartUnresponsive
					data={ chartData }
					size={ 400 }
					withTooltips={ true }
					thickness={ 0.7 }
				>
					<PieChartUnresponsive.HTML>
						<h3 style={ { textAlign: 'center', marginBottom: '20px' } }>
							Device Usage Distribution
						</h3>
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
			</div>
		);
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
