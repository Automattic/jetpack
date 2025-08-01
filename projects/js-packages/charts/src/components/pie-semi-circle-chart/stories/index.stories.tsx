import { sharedDecorator } from '../../../stories/decorator-config';
import { legendArgTypes } from '../../../stories/legend-config';
import { PieSemiCircleChart } from '../index';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = React.ComponentProps< typeof PieSemiCircleChart > & {
	containerWidth?: string;
	containerHeight?: string;
	resize?: string;
};

const data = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
		percentage: 5,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
		percentage: 1,
	},
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '80K',
		percentage: 2,
	},
];

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Pie Semi Circle Chart',
	component: PieSemiCircleChart,
	parameters: {
		layout: 'centered',
	},
	decorators: sharedDecorator,
	argTypes: {
		width: {
			control: {
				type: 'range',
				min: 100,
				max: 1000,
				step: 10,
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
		...legendArgTypes,
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		containerWidth: '600px',
		containerHeight: '325px',
		resize: 'none',
		thickness: 0.4,
		data,
		label: 'OS',
		note: 'Windows +10%',
		clockwise: true,
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
				story: 'Semi-circle pie chart with interactive tooltips that appear on hover.',
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

export const CustomLegendPositioning: Story = {
	args: {
		containerWidth: '600px',
		containerHeight: '350px',
		resize: 'none',
		thickness: 0.4,
		data: [
			{
				label: 'MacOS',
				value: 30000,
				valueDisplay: '30K',
				percentage: 30,
			},
			{
				label: 'Linux',
				value: 22000,
				valueDisplay: '22K',
				percentage: 22,
			},
			{
				label: 'Windows',
				value: 48000,
				valueDisplay: '48K',
				percentage: 48,
			},
		],
		label: 'OS',
		note: 'Windows +10%',
		withTooltips: true,
		showLegend: true,
		legendOrientation: 'vertical',
		legendAlignmentHorizontal: 'right',
		legendAlignmentVertical: 'top',
		legendShape: 'circle',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Semi-circle pie chart with right-top positioned vertical legend. This demonstrates non-default legend positioning to showcase different legend placement possibilities with OS usage data.',
			},
		},
	},
};

const responsiveArgs = { ...Default.args, resize: 'both' };
delete responsiveArgs.width;
export const Responsiveness: Story = {
	args: responsiveArgs,
	parameters: {
		docs: {
			description: {
				story:
					'Semi-circle pie chart with responsive behavior. Uses width prop for unified width/height handling.',
			},
		},
	},
};

export const ErrorStates: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Empty Data</h3>
				<PieSemiCircleChart width={ 300 } data={ [] } />
			</div>

			<div>
				<h3>Zero Total Percentage</h3>
				<PieSemiCircleChart
					width={ 300 }
					data={ [
						{ label: 'A', value: 0, percentage: 0 },
						{ label: 'B', value: 0, percentage: 0 },
					] }
				/>
			</div>

			<div>
				<h3>Negative Values</h3>
				<PieSemiCircleChart
					width={ 300 }
					data={ [
						{ label: 'A', value: -30, percentage: -30 },
						{ label: 'B', value: 130, percentage: 130 },
					] }
				/>
			</div>

			<div>
				<h3>Single Data Point</h3>
				<PieSemiCircleChart
					width={ 300 }
					data={ [ { label: 'Single Point', value: 100, percentage: 100 } ] }
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					'Examples of how the semi-circle pie chart handles various error states and edge cases.',
			},
		},
	},
};
