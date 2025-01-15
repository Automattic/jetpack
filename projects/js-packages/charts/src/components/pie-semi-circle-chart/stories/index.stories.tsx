import { PieSemiCircleChart } from '../index';
import type { Meta, StoryObj } from '@storybook/react';

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

const ResponsiveDecorator = Story => (
	<div
		style={ {
			resize: 'both',
			overflow: 'hidden',
			padding: '2rem',
			width: '800px',
			height: '600px',
			minWidth: '400px',
			minHeight: '300px',
			maxWidth: '1200px',
			border: '1px dashed #ccc',
		} }
	>
		<Story />
	</div>
);

const meta = {
	title: 'JS Packages/Charts/Types/Pie Semi Circle Chart',
	component: PieSemiCircleChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ ResponsiveDecorator ],
	argTypes: {
		width: {
			control: {
				type: 'range',
				min: 0,
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
	},
} satisfies Meta< typeof PieSemiCircleChart >;

export default meta;
type Story = StoryObj< typeof PieSemiCircleChart >;

export const Default: Story = {
	args: {
		thickness: 0.4,
		data,
		label: 'OS',
		note: 'Windows +10%',
		clockwise: true,
		showLegend: false,
		legendOrientation: 'horizontal',
	},
};

export const WithTooltips: Story = {
	args: {
		data,
		label: 'OS',
		note: 'Windows +10%',
		withTooltips: true,
	},
};

export const WithHorizontalLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
		legendOrientation: 'horizontal',
	},
};

export const WithVerticalLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
		legendOrientation: 'vertical',
	},
};

export const FixedDimensions: Story = {
	render: args => (
		<div style={ { width: '400px' } }>
			<PieSemiCircleChart { ...args } />
		</div>
	),
	args: {
		width: 400,
		thickness: 0.4,
		data,
		label: 'Fixed Dimensions',
		note: 'Non-responsive chart',
		clockwise: true,
		showLegend: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Semi-circle pie chart with fixed dimensions that override the responsive behavior. Only width is needed as height is calculated internally.',
			},
		},
	},
};
