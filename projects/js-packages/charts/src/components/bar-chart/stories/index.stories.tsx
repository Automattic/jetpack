import { BarChart } from '../index';
import type { Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Charts/Bar Chart',
	component: BarChart,
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
} satisfies Meta< typeof BarChart >;

const Template = args => <BarChart { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	width: 500,
	height: 300,
	data: [
		{ label: 'Jan', value: 12 },
		{ label: 'Feb', value: 18 },
		{ label: 'Mar', value: 29 },
		{ label: 'Apr', value: 33 },
		{ label: 'May', value: 45 },
		{ label: 'Jun', value: 52 },
	],
};
