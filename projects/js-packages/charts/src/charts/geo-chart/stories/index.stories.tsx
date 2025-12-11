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
