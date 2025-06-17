import React from 'react';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import sampleData from './sample-data';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const meta: Meta< typeof LineChart > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart/Annotations',
} satisfies Meta< typeof LineChart >;

export default meta;

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

const annotationStoryArgs = {
	...lineChartStoryArgs,
	showLegend: true,
	annotations: [
		{
			datum: sampleData[ 0 ].data[ 10 ],
			title: 'Annotation 1',
			subtitle: 'Annotation 1 subtitle',
		},
		{
			datum: sampleData[ 1 ].data[ sampleData[ 1 ].data.length - 10 ],
			title: 'Annotation 1',
			subtitle: 'Annotation 1 subtitle',
		},
	],
};

export const Default: StoryObj< typeof LineChart > = Template.bind( {} );
Default.args = {
	...annotationStoryArgs,
};
