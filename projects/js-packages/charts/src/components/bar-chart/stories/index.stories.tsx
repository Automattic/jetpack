import BarChart from '../index';
import data from './sample-data';
import type { Meta, StoryObj } from '@storybook/react';

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

type StoryType = StoryObj< typeof BarChart >;

// Default story with multiple series
export const Default: StoryType = {
	args: {
		width: 800,
		height: 500,
		data: [ data[ 0 ], data[ 1 ], data[ 2 ] ], // limit to 3 series for better readability
		withTooltips: true,
	},
};

// Story with single data series
export const SingleSeries: StoryType = {
	args: {
		...Default.args,
		data: [ data[ 0 ] ],
	},
	parameters: {
		docs: {
			description: {
				story: 'Bar chart with a single data series.',
			},
		},
	},
};

// Story without tooltip
export const ManyDataSeries: StoryType = {
	args: {
		...Default.args,
		width: 1200,
		height: 700,
		data,
	},
	parameters: {
		docs: {
			description: {
				story: 'Bar chart with many data series.',
			},
		},
	},
};
