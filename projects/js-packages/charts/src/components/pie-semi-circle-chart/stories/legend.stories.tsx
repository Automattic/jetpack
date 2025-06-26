import React from 'react';
import { legendArgTypes, legendDecorator } from '../../../stories/legend-config';
import { PieSemiCircleChart } from '../../pie-semi-circle-chart';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const data = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
		percentage: 30,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
		percentage: 22,
	},
	{
		label: 'Windows',
		value: 48000,
		valueDisplay: '48K',
		percentage: 48,
	},
];

const meta: Meta< typeof PieSemiCircleChart > = {
	title: 'JS Packages/Charts/Types/Pie Semi Circle Chart/Legend',
	component: PieSemiCircleChart,
	parameters: {
		layout: 'centered',
	},
	decorators: legendDecorator,
	argTypes: legendArgTypes,
} satisfies Meta< typeof PieSemiCircleChart >;

export default meta;

const Template: StoryFn< typeof PieSemiCircleChart > = args => <PieSemiCircleChart { ...args } />;

const legendStoryArgs = {
	data,
	width: 600,
	thickness: 0.4,
	withTooltips: true,
	showLegend: true,
	legendOrientation: 'horizontal' as const,
	label: 'OS',
	note: 'Windows +10%',
};

export const Default: StoryObj< typeof PieSemiCircleChart > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
};

export const AlignmentPositioning: StoryObj< typeof PieSemiCircleChart > = Template.bind( {} );
AlignmentPositioning.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendAlignmentVertical: 'top',
};

export const VerticalOrientation: StoryObj< typeof PieSemiCircleChart > = Template.bind( {} );
VerticalOrientation.args = {
	...legendStoryArgs,
	legendOrientation: 'vertical',
	legendAlign: 'right',
	legendAlignmentVertical: 'top',
};
