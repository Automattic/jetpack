import { PieSemiCircleChart } from '../index';
import type { Meta } from '@storybook/react';

const data = [
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '$80K',
		percentage: 2,
		color: '#3858E9',
		index: 0,
	},
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '$30K',
		percentage: 5,
		color: '#80C8FF',
		index: 1,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '$22K',
		percentage: 1,
		color: '#B999FF',
		index: 2,
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
			<div style={ { position: 'relative', padding: '2rem' } }>
				<Story />
			</div>
		),
	],
} satisfies Meta< typeof PieSemiCircleChart >;

export const Default = {
	args: {
		width: 500,
		height: 300,
		data,
		label: 'OS',
		note: 'Windows +10%',
		showTooltips: false,
	},
};

export const WithTooltips = {
	args: {
		...Default.args,
		showTooltips: true,
	},
};
