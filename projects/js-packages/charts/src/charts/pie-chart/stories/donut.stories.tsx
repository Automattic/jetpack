/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	__experimentalText as WPText,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { Fragment } from 'react';
import { BaseLegendItem } from '../../../components/legend/types';
import { GlobalChartsProvider } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	legendArgTypes,
	themeArgTypes,
} from '../../../stories';
import { customerRevenueData, customerRevenueLegendData } from '../../../stories/sample-data';
import { Group } from '../../../visx/group';
import { Text } from '../../../visx/text';
import { PieChart, PieChartUnresponsive } from '../../pie-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof PieChart > >;

const data = [
	{
		label: 'Active Users',
		value: 65000,
		valueDisplay: '65K',
		percentage: 65,
	},
	{
		label: 'Inactive Users',
		value: 35000,
		valueDisplay: '35K',
		percentage: 35,
	},
];

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Donut Chart',
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
		},
		thickness: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
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
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		size: 400,
		containerWidth: '432px',
		containerHeight: '432px',
		resize: 'none',
		thickness: 0.5,
		gapScale: 0.03,
		cornerScale: 0.03,
		withTooltips: true,
		data,
		children: (
			<Group>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 24 } y={ -16 }>
					User Activity
				</Text>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 18 } y={ 16 }>
					Total: 100K Users
				</Text>
			</Group>
		),
	},
};

export const WithoutCenter: Story = {
	args: {
		...Default.args,
		children: undefined,
	},
};

export const ErrorStates: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Empty Data</h3>
				<PieChart size={ 300 } thickness={ 0.6 } data={ [] } />
			</div>
			<div>
				<h3>Single Value</h3>
				<PieChart
					size={ 300 }
					thickness={ 0.6 }
					data={ [ { label: 'Single', value: 100, percentage: 100 } ] }
				/>
			</div>
		</div>
	),
};

export const Thin: Story = {
	args: {
		...Default.args,
		thickness: 0.2,
		gapScale: 0.01,
		size: 700,
		containerWidth: '732px',
		containerHeight: '732px',
		children: (
			<Group>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 24 } y={ -16 }>
					Thin Donut
				</Text>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 18 } y={ 16 }>
					Thickness: 20%
				</Text>
			</Group>
		),
	},
};

export const Doughnut: Story = {
	args: {
		...Default.args,
		thickness: 0.5,
		gapScale: 0.03,
		cornerScale: 0.03,
		size: 600,
		containerWidth: '632px',
		containerHeight: '632px',
		children: (
			<Group>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 24 } y={ -16 }>
					🍩 Doughnut
				</Text>
				<Text textAnchor="middle" verticalAnchor="middle" fill="#008A20" fontSize={ 18 } y={ 16 }>
					Three donuts for the price of one!
				</Text>
			</Group>
		),
	},
	parameters: {
		docs: {
			description: {
				story: 'Doughnut chart variant with the thickness set to 0.5 (50%).',
			},
		},
	},
};

export const WithTooltipsDoughnut: Story = {
	args: {
		...Default.args,
		thickness: 0.5,
		withTooltips: true,
	},
	parameters: {
		docs: {
			description: {
				story: 'Doughnut chart with interactive tooltips that appear on hover.',
			},
		},
	},
};

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
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
				<h3>Traditional Props-based</h3>
				<PieChart
					size={ 300 }
					data={ args.data }
					thickness={ 0.5 }
					showLegend={ true }
					legendPosition={ args.legendPosition || 'bottom' }
					legendOrientation={ args.legendOrientation || 'horizontal' }
					legendAlignment={ args.legendAlignment || 'center' }
					legendMaxWidth={ args.legendMaxWidth }
					legendTextOverflow={ args.legendTextOverflow || 'wrap' }
					legendValueDisplay={ args.legendValueDisplay }
				>
					<Group>
						<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 16 } y={ -8 }>
							User Stats
						</Text>
						<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 14 } y={ 12 } fill="#666">
							100K Total
						</Text>
					</Group>
				</PieChart>
			</div>
			<div>
				<h3>Composition API</h3>
				<PieChart
					size={ 300 }
					data={ args.data }
					thickness={ 0.5 }
					legendValueDisplay={ args.legendValueDisplay }
				>
					<Group>
						<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 16 } y={ -8 }>
							User Stats
						</Text>
						<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 14 } y={ 12 } fill="#666">
							100K Total
						</Text>
					</Group>
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
		thickness: 0.5,
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
					'Demonstrates the donut chart composition API, allowing flexible combination of chart elements and legends.',
			},
		},
	},
};

export const InteractiveLegend: Story = {
	render: args => (
		<GlobalChartsProvider>
			<div style={ { padding: '20px' } }>
				<h3>Interactive Donut Chart</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Click legend items to show/hide segments. The total value updates dynamically.
				</p>
				<PieChartUnresponsive
					chartId="interactive-donut-chart"
					size={ args.size || 400 }
					data={ args.data }
					thickness={ 0.5 }
					showLegend={ true }
					legendInteractive={ true }
					legendPosition={ args.legendPosition || 'bottom' }
					legendOrientation={ args.legendOrientation || 'horizontal' }
					legendAlignment={ args.legendAlignment || 'center' }
					legendValueDisplay={ args.legendValueDisplay }
				>
					<Group>
						<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 16 } y={ -8 }>
							User Stats
						</Text>
						<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 14 } y={ 12 } fill="#666">
							100K Total
						</Text>
					</Group>
				</PieChartUnresponsive>
			</div>
		</GlobalChartsProvider>
	),
	args: {
		data,
		size: 400,
		thickness: 0.5,
		containerHeight: '600px',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive donut chart with clickable legend. Segments can be hidden/shown, and percentages recalculate automatically. Requires chartId and GlobalChartsProvider.',
			},
		},
	},
};

export const CustomLegendPositioning: Story = {
	args: {
		...Default.args,
		thickness: 0.4,
		showLegend: true,
		legendOrientation: 'vertical',
		legendAlignment: 'start',
		legendPosition: 'top',
		containerHeight: '450px',
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
		children: (
			<Group>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 18 } y={ -8 }>
					Distribution
				</Text>
			</Group>
		),
	},
	parameters: {
		docs: {
			description: {
				story: 'Donut chart with vertical legend positioned at the top left.',
			},
		},
	},
};

const CustomPieLegend = ( {
	chartItems,
	items,
	withComparison,
}: {
	chartItems: BaseLegendItem[];
	items: { label: string; value: number; formattedValue: string; comparison: string }[];
	withComparison: boolean;
} ) => (
	<div
		style={ {
			display: 'inline-grid',
			gridTemplateColumns: '1fr auto auto',
			gap: 'var(--wpds-dimension-gap-2xs, 4px) var(--wpds-dimension-gap-xs, 8px)',
		} }
	>
		{ items.map( ( item, index ) => {
			const { color } = chartItems[ index ];

			return (
				<Fragment key={ index }>
					<HStack direction="row" justify="flex-start" spacing={ 2 }>
						<div
							style={ {
								width: '8px',
								height: '8px',
								borderRadius: '50%',
								flexShrink: 0,
								backgroundColor: color,
							} }
						/>
						<WPText size="small">{ item.label }</WPText>
					</HStack>
					<WPText size="small" weight={ 600 } style={ { textAlign: 'right' } }>
						{ item.formattedValue }
					</WPText>
					<WPText size="small" style={ { textAlign: 'right', color: '#008a20' } }>
						{ withComparison && item.comparison }
					</WPText>
				</Fragment>
			);
		} ) }
	</div>
);

export const CustomLegend: Story = {
	render: args => (
		<PieChartUnresponsive { ...args }>
			<PieChartUnresponsive.Legend
				// eslint-disable-next-line react/jsx-no-bind
				render={ items => (
					<CustomPieLegend
						chartItems={ items }
						items={ customerRevenueLegendData }
						withComparison={ args.withComparison }
					/>
				) }
			/>
		</PieChartUnresponsive>
	),
	args: {
		...Default.args,
		data: customerRevenueData.map( segment => ( { ...segment, label: '' } ) ),
		thickness: 0.3,
		cornerScale: 0.03,
		gapScale: 0.01,
		size: 164,
		withComparison: true,
		withTooltips: false,
		containerHeight: '300px',
	},
	parameters: {
		docs: {
			description: {
				story: 'Demonstrates how to customize the legend using the render prop.',
			},
		},
	},
};
