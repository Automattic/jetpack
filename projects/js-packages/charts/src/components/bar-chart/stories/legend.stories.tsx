import { sharedDecorator } from '../../../stories/decorator-config';
import { legendArgTypes } from '../../../stories/legend-config';
import { BarChart } from '../../bar-chart';
import sampleData from './sample-data';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const meta: Meta< typeof BarChart > = {
	title: 'JS Packages/Charts/Types/Bar Chart/Legend',
	component: BarChart,
	parameters: {
		layout: 'centered',
	},
	decorators: sharedDecorator,
	argTypes: legendArgTypes,
} satisfies Meta< typeof BarChart >;

export default meta;

const Template: StoryFn< typeof BarChart > = args => <BarChart { ...args } />;

const legendStoryArgs = {
	data: sampleData.slice( 0, 3 ), // Use first 3 countries for cleaner legend
	containerWidth: '800px',
	containerHeight: '400px',
	showLegend: true,
	legendOrientation: 'horizontal' as const,
	withTooltips: true,
};

export const Default: StoryObj< typeof BarChart > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
};

export const AlignmentPositioning: StoryObj< typeof BarChart > = Template.bind( {} );
AlignmentPositioning.args = {
	...legendStoryArgs,
	legendAlignmentHorizontal: 'right',
	legendAlignmentVertical: 'top',
};

export const VerticalOrientation: StoryObj< typeof BarChart > = Template.bind( {} );
VerticalOrientation.args = {
	...legendStoryArgs,
	legendOrientation: 'vertical',
	legendAlignmentHorizontal: 'right',
	legendAlignmentVertical: 'top',
};

export const HorizontalBars: StoryObj< typeof BarChart > = Template.bind( {} );
HorizontalBars.args = {
	...legendStoryArgs,
	orientation: 'horizontal',
	legendAlignmentHorizontal: 'right',
	legendAlignmentVertical: 'top',
};
