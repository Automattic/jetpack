import { jetpackTheme, wooTheme } from '../../../providers/theme';
import { sharedDecorator } from '../../../stories/decorator-config';
import { Group } from '../../../visx/group';
import { Text } from '../../../visx/text';
import { PieChart } from '../../pie-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = React.ComponentProps< typeof PieChart > & {
	containerWidth?: string;
	containerHeight?: string;
	resize?: string;
	theme?: string | object;
};

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
	title: 'JS Packages/Charts/Types/Donut Chart',
	component: PieChart,
	parameters: {
		layout: 'centered',
	},
	decorators: sharedDecorator,
	argTypes: {
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
		size: 400,
		containerWidth: '432px',
		containerHeight: '432px',
		resize: 'none',
		thickness: 0.5,
		gapScale: 0.03,
		padding: 20,
		cornerScale: 0.03,
		withTooltips: true,
		data,
		theme: 'default',
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

export const CustomTheme: Story = {
	args: {
		...Default.args,
		theme: wooTheme,
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
		padding: 0,
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
