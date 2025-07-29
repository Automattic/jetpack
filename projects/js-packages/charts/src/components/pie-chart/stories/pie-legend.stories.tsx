import { sharedDecorator } from '../../../stories/decorator-config';
import { legendArgTypes } from '../../../stories/legend-config';
import { PieChart } from '../../pie-chart';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = React.ComponentProps< typeof PieChart > & {
	containerWidth?: string;
	containerHeight?: string;
	resize?: string;
};

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

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Pie Chart/Legend',
	component: PieChart,
	parameters: {
		layout: 'centered',
	},
	decorators: sharedDecorator,
	argTypes: legendArgTypes,
};

export default meta;

const Template: StoryFn< StoryArgs > = args => <PieChart { ...args } />;

const legendStoryArgs = {
	data,
	resize: 'none',
	containerWidth: '432px',
	containerHeight: '480px',
	thickness: 0, // Full pie (not donut)
	innerRadius: 0, // Explicitly set inner radius for full pie
	gapScale: 0.03,
	padding: 20,
	cornerScale: 0.03,
	withTooltips: true,
	showLegend: true,
	legendOrientation: 'horizontal' as const,
};

export const Default: StoryObj< StoryArgs > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
};

export const AlignmentPositioning: StoryObj< StoryArgs > = Template.bind( {} );
AlignmentPositioning.args = {
	...legendStoryArgs,
	legendAlignmentHorizontal: 'right',
	legendAlignmentVertical: 'top',
};

export const VerticalOrientation: StoryObj< StoryArgs > = Template.bind( {} );
VerticalOrientation.args = {
	...legendStoryArgs,
	legendOrientation: 'vertical',
	legendAlignmentHorizontal: 'right',
	legendAlignmentVertical: 'top',
	containerHeight: '524px',
};
