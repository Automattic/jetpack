import React from 'react';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const meta: Meta< typeof LineChart > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart/Legend',
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

export const Rectangle: StoryObj< typeof LineChart > = Template.bind( {} );
Rectangle.args = {
	...legendStoryArgs,
	showLegend: true,
	legendShape: 'rect',
};

export const Vertical: StoryObj< typeof LineChart > = Template.bind( {} );
Vertical.args = {
	...legendStoryArgs,
	showLegend: true,
	legendOrientation: 'vertical',
};
