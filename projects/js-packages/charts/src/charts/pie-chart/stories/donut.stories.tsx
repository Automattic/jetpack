import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	extractLegendConfig,
	legendArgTypes,
	themeArgTypes,
} from '../../../stories';
import { Group } from '../../../visx/group';
import { Text } from '../../../visx/text';
import { PieChart } from '../../pie-chart';
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
				<PieChart
					height={ 300 }
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
				size={ 300 }
				thickness={ 0.5 }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-donut-chart"
			>
				<Group>
					<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 16 } y={ -8 }>
						User Stats
					</Text>
					<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 14 } y={ 12 } fill="#666">
						100K Total
					</Text>
				</Group>
				<PieChart.Legend { ...legend } />
			</PieChart>
		);
	},
	args: {
		data,
		thickness: 0.5,
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
