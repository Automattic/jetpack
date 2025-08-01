import { jetpackTheme, wooTheme } from '../../../providers/theme';
import { sharedDecorator } from '../../../stories/decorator-config';
import { legendArgTypes } from '../../../stories/legend-config';
import { PieChart } from '../index';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = React.ComponentProps< typeof PieChart > & {
	theme?: string | object;
	resize?: string;
	containerWidth?: string;
	containerHeight?: string;
};

const data = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
		percentage: 23,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
		percentage: 17,
	},
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '80K',
		percentage: 60,
	},
];

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
		legendAlignmentHorizontal: 'center',
		legendAlignmentVertical: 'top',
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
					'Pie chart with top-center positioned vertical legend. This demonstrates non-default legend positioning to showcase different legend placement possibilities with device usage data.',
			},
		},
	},
};
