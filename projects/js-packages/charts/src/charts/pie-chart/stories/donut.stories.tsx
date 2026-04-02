/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { Text as WPText } from '@wordpress/ui';
import { Fragment } from 'react';
import { BaseLegendItem } from '../../../components/legend/types';
import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	extractLegendConfig,
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
	},
	{
		label: 'Inactive Users',
		value: 35000,
		valueDisplay: '35K',
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
	render: args => {
		const legend = extractLegendConfig( args );
		return <PieChart { ...args } legend={ legend } />;
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		containerWidth: '432px',
		containerHeight: '432px',
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

export const WithSize: Story = {
	args: {
		...Default.args,
		size: 200,
		thickness: 0.3,
		showLabels: false,
		children: (
			<Group>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 18 } y={ -16 }>
					User Activity
				</Text>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 14 } y={ 16 }>
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
				<PieChart height={ 300 } thickness={ 0.6 } data={ [] } />
			</div>
			<div>
				<h3>Single Value</h3>
				<PieChart height={ 300 } thickness={ 0.6 } data={ [ { label: 'Single', value: 100 } ] } />
			</div>
		</div>
	),
};

export const Thin: Story = {
	args: {
		...Default.args,
		thickness: 0.2,
		gapScale: 0.01,
		showLabels: false,
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

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
	},
};

export const WithTooltips: Story = {
	args: {
		...Default.args,
		showLabels: false,
		withTooltips: true,
		children: (
			<Group>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 14 } y={ -10 }>
					Hover over segments
				</Text>
				<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 14 } y={ 10 }>
					to see tooltips
				</Text>
			</Group>
		),
	},
};

export const WithLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
		containerHeight: '500px',
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
		const legend = extractLegendConfig( args );
		return (
			<PieChart
				{ ...args }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-donut-chart"
			>
				{ args.children }
				<PieChart.Legend { ...legend } />
			</PieChart>
		);
	},
	args: {
		...Default.args,
		containerHeight: '500px',
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
			gap: 'var(--wpds-dimension-gap-xs, 4px) var(--wpds-dimension-gap-sm, 8px)',
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
						<WPText variant="body-sm">{ item.label }</WPText>
					</HStack>
					<WPText variant="body-sm" style={ { fontWeight: 600, textAlign: 'right' } }>
						{ item.formattedValue }
					</WPText>
					<WPText variant="body-sm" style={ { textAlign: 'right', color: '#008a20' } }>
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
		data: customerRevenueData,
		showLabels: false,
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
