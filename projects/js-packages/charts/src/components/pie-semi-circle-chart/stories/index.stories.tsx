import { PieSemiCircleChart } from '../index';
import type { Meta } from '@storybook/react';

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

export default {
	title: 'JS Packages/Charts/Types/Pie Semi Circle Chart',
	component: PieSemiCircleChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div
				style={ {
					resize: 'both',
					overflow: 'auto',
					padding: '2rem',
					width: '800px',
					minWidth: '400px',
					maxWidth: '1200px',
					border: '1px dashed #ccc',
				} }
			>
				<Story />
			</div>
		),
	],
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

const Template = args => <PieSemiCircleChart { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	width: 500,
	thickness: 0.4,
	data,
	label: 'OS',
	note: 'Windows +10%',
	clockwise: true,
	showLegend: false,
	legendOrientation: 'horizontal',
};

export const WithTooltips = Template.bind( {} );
WithTooltips.args = {
	width: 500,
	data,
	label: 'OS',
	note: 'Windows +10%',
	withTooltips: true,
};

export const WithHorizontalLegend = Template.bind( {} );
WithHorizontalLegend.args = {
	...Default.args,
	showLegend: true,
	legendOrientation: 'horizontal',
};

export const WithVerticalLegend = Template.bind( {} );
WithVerticalLegend.args = {
	...Default.args,
	showLegend: true,
	legendOrientation: 'vertical',
};
