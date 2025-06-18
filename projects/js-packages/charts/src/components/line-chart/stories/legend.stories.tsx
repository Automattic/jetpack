import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const meta: Meta< typeof LineChart > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart/Legend',
	argTypes: {
		...lineChartMetaArgs.argTypes,
		legendAlign: {
			control: 'select',
			options: [ 'left', 'center', 'right' ],
		},
		legendVerticalAlign: {
			control: 'select',
			options: [ 'top', 'bottom' ],
		},
		legendOrientation: {
			control: 'select',
			options: [ 'horizontal', 'vertical' ],
		},
		legendShape: {
			control: 'select',
			options: [ 'circle', 'rect' ],
		},
	},
} satisfies Meta< typeof LineChart >;

export default meta;

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

const legendStoryArgs = {
	...lineChartStoryArgs,
	showLegend: true,
	height: 400,
};

export const Default: StoryObj< typeof LineChart > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
};

export const AlignmentPositioning: StoryObj< typeof LineChart > = Template.bind( {} );
AlignmentPositioning.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};
