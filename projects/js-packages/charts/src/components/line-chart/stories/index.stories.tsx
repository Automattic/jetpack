import { LineChart } from '../index';
import sampleData from './sample-data';
import type { Meta } from '@storybook/react';

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
	data: sampleData.mars,
};
