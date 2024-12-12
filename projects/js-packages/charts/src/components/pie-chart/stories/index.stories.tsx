import { PieChart } from '../index';
import type { Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Charts/Types/Pie Chart',
	component: PieChart,
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
} satisfies Meta< typeof PieChart >;

const Template = args => <PieChart { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	width: 400,
	height: 400,
	showTooltips: false,
	data: [
		{ label: 'A', value: 30 },
		{ label: 'B', value: 20 },
		{ label: 'C', value: 15 },
		{ label: 'D', value: 35 },
	],
};

export const WithTooltips = Template.bind( {} );
WithTooltips.args = {
	...Default.args,
	showTooltips: true,
};
WithTooltips.parameters = {
	docs: {
		description: {
			story: 'Pie chart with interactive tooltips that appear on hover.',
		},
	},
};
