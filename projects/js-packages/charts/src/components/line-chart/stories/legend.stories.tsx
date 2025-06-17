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

export const TopRight: StoryObj< typeof LineChart > = Template.bind( {} );
TopRight.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};

export const TopLeft: StoryObj< typeof LineChart > = Template.bind( {} );
TopLeft.args = {
	...legendStoryArgs,
	legendAlign: 'left',
	legendVerticalAlign: 'top',
};

export const TopCenter: StoryObj< typeof LineChart > = Template.bind( {} );
TopCenter.args = {
	...legendStoryArgs,
	legendAlign: 'center',
	legendVerticalAlign: 'top',
};

export const BottomLeft: StoryObj< typeof LineChart > = Template.bind( {} );
BottomLeft.args = {
	...legendStoryArgs,
	legendAlign: 'left',
	legendVerticalAlign: 'bottom',
};

export const BottomCenter: StoryObj< typeof LineChart > = Template.bind( {} );
BottomCenter.args = {
	...legendStoryArgs,
	legendAlign: 'center',
	legendVerticalAlign: 'bottom',
};

export const BottomRight: StoryObj< typeof LineChart > = Template.bind( {} );
BottomRight.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendVerticalAlign: 'bottom',
};
