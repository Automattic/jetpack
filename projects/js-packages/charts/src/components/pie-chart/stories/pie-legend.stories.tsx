import React from 'react';
import { legendArgTypes, legendDecorator } from '../../../stories/legend-config';
import { PieChart } from '../../pie-chart';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const data = [
	{
		label: 'Desktop',
		value: 45000,
		valueDisplay: '45K',
		percentage: 45,
	},
	{
		label: 'Mobile',
		value: 35000,
		valueDisplay: '35K',
		percentage: 35,
	},
	{
		label: 'Tablet',
		value: 20000,
		valueDisplay: '20K',
		percentage: 20,
	},
];

const meta: Meta< typeof PieChart > = {
	title: 'JS Packages/Charts/Types/Pie Chart/Legend',
	component: PieChart,
	parameters: {
		layout: 'centered',
	},
	decorators: legendDecorator,
	argTypes: legendArgTypes,
} satisfies Meta< typeof PieChart >;

export default meta;

const Template: StoryFn< typeof PieChart > = args => <PieChart { ...args } />;

const legendStoryArgs = {
	data,
	width: 600,
	height: 600,
	thickness: 0, // Full pie (not donut)
	innerRadius: 0, // Explicitly set inner radius for full pie
	gapScale: 0.03,
	padding: 20,
	cornerScale: 0.03,
	withTooltips: true,
	showLegend: true,
	legendOrientation: 'horizontal' as const,
};

export const Default: StoryObj< typeof PieChart > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
};

export const AlignmentPositioning: StoryObj< typeof PieChart > = Template.bind( {} );
AlignmentPositioning.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendAlignmentVertical: 'top',
};

export const VerticalOrientation: StoryObj< typeof PieChart > = Template.bind( {} );
VerticalOrientation.args = {
	...legendStoryArgs,
	legendOrientation: 'vertical',
	legendAlign: 'right',
	legendAlignmentVertical: 'top',
};
