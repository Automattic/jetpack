import { LineChart } from '../index';
import type { Meta } from '@storybook/react';

const data = [
	{ date: new Date( '2023-01-01' ), value: 10 },
	{ date: new Date( '2023-02-01' ), value: 20 },
	{ date: new Date( '2023-03-01' ), value: 15 },
	{ date: new Date( '2023-04-01' ), value: 25 },
];

export default {
	title: 'JS Packages/Charts/Types/Line Chart',
	component: LineChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { padding: '2rem' } }>
				<Story />
			</div>
		),
	],
} satisfies Meta< typeof LineChart >;

const Template = args => <LineChart { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	width: 500,
	height: 300,
	margin: { top: 20, right: 20, bottom: 30, left: 40 },
	data,
};
