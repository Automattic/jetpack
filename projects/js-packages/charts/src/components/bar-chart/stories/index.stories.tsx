import BarChart from '../index';
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
	showTooltips: false,
	data: [
		{ label: 'Jan', value: 12 },
		{ label: 'Feb', value: 18 },
		{ label: 'Mar', value: 29 },
		{ label: 'Apr', value: 33 },
		{ label: 'May', value: 45 },
		{ label: 'Jun', value: 52 },
	],
};

export const WithTooltips = Template.bind( {} );
WithTooltips.args = {
	...Default.args,
	showTooltips: true,
	data: [
		{ label: 'Q1', value: 420 },
		{ label: 'Q2', value: 650 },
		{ label: 'Q3', value: 850 },
		{ label: 'Q4', value: 950 },
	],
};
WithTooltips.parameters = {
	docs: {
		description: {
			story: 'Bar chart with interactive tooltips that appear on hover.',
		},
	},
};
