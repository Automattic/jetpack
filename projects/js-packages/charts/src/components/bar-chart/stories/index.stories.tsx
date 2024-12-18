import BarChart from '../index';
import data from './sample-data';
import type { Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Charts/Types/Bar Chart',
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
	margin: { top: 20, right: 20, bottom: 40, left: 40 },
	withTooltips: false,
	data: data[ 0 ].data,
	seriesLabel: data[ 0 ].group,
	showLegend: false,
	legendOrientation: 'horizontal',
};

export const WithTooltips = Template.bind( {} );
WithTooltips.args = {
	...Default.args,
	withTooltips: true,
};

WithTooltips.parameters = {
	docs: {
		description: {
			story: 'Bar chart with interactive tooltips that appear on hover.',
		},
	},
};

export const WithLegend = {
	args: {
		width: 500,
		height: 350,
		margin: { top: 20, right: 20, bottom: 40, left: 40 },
		data: data[ 0 ].data,
		seriesLabel: data[ 0 ].group,
		showTooltips: true,
		showLegend: true,
		legendOrientation: 'horizontal',
	},
};

export const WithVerticalLegend = {
	args: {
		...WithLegend.args,
		legendOrientation: 'vertical',
	},
};
