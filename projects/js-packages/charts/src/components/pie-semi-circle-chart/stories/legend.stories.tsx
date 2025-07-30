import { sharedDecorator } from '../../../stories/decorator-config';
import { legendArgTypes } from '../../../stories/legend-config';
import { PieSemiCircleChart } from '../../pie-semi-circle-chart';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = React.ComponentProps< typeof PieSemiCircleChart > & {
	containerWidth?: string;
	containerHeight?: string;
	resize?: string;
};

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

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Pie Semi Circle Chart/Legend',
	component: PieSemiCircleChart,
	parameters: {
		layout: 'centered',
	},
	decorators: sharedDecorator,
	argTypes: legendArgTypes,
} satisfies Meta< StoryArgs >;

export default meta;

const Template: StoryFn< StoryArgs > = args => <PieSemiCircleChart { ...args } />;

const legendStoryArgs = {
	data,
	containerWidth: '600px',
	containerHeight: '350px',
	resize: 'none',
	thickness: 0.4,
	withTooltips: true,
	showLegend: true,
	legendOrientation: 'horizontal' as const,
	label: 'OS',
	note: 'Windows +10%',
};

export const Default: StoryObj< StoryArgs > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
	containerHeight: '350px',
};

export const AlignmentPositioning: StoryObj< StoryArgs > = Template.bind( {} );
AlignmentPositioning.args = {
	...legendStoryArgs,
	legendAlignmentHorizontal: 'right',
	legendAlignmentVertical: 'top',
	containerHeight: '350px',
};

export const VerticalOrientation: StoryObj< StoryArgs > = Template.bind( {} );
VerticalOrientation.args = {
	...legendStoryArgs,
	legendOrientation: 'vertical',
	legendAlignmentHorizontal: 'right',
	legendAlignmentVertical: 'top',
	containerHeight: '350px',
};
