import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
	ordersByCountry,
	themeArgTypes,
} from '../../../stories';
import GeoChart from '../geo-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof GeoChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Geo Chart',
	component: GeoChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
	},
};

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		data: ordersByCountry,
		withPadding: false,
	},
};

export const ZoomEurope: Story = {
	args: {
		...Default.args,
		scale: 550,
		center: [ 15, 50 ], // [longitude, latitude] - Central Europe
	},
};

export const ZoomUSA: Story = {
	args: {
		...Default.args,
		scale: 600,
		center: [ -95, 40 ], // [longitude, latitude] - Central USA
	},
};

export const SingleCountry: Story = {
	args: {
		...Default.args,
		data: {
			USA: 1500,
		},
	},
};

export const EmptyData: Story = {
	args: {
		...Default.args,
		data: {},
	},
};
