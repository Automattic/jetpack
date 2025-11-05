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
	title: 'JS Packages/Charts/Types/Geo Chart',
	component: GeoChart,
	parameters: {
		layout: 'centered',
	},
	tags: [ 'autodocs' ],
	argTypes: {
		data: {
			control: 'object',
			description: 'Record mapping country ISO codes to numeric values',
			table: {
				type: { summary: 'Record<string, number>' },
			},
		},
		width: {
			control: { type: 'number', min: 400, max: 1200, step: 50 },
			description: 'Width of the chart in pixels',
			table: {
				type: { summary: 'number' },
				defaultValue: { summary: '800' },
			},
		},
		height: {
			control: { type: 'number', min: 300, max: 800, step: 50 },
			description: 'Height of the chart in pixels',
			table: {
				type: { summary: 'number' },
				defaultValue: { summary: '500' },
			},
		},
		className: {
			control: 'text',
			description: 'Additional CSS class name',
			table: {
				type: { summary: 'string' },
			},
		},
		...sharedChartArgTypes,
		...themeArgTypes,
	},
	decorators: [ chartDecorator ],
};

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		data: ordersByCountry,
		width: 800,
		height: 500,
	},
};

export const SmallSize: Story = {
	args: {
		data: ordersByCountry,
		width: 600,
		height: 400,
	},
};

export const SingleCountry: Story = {
	args: {
		data: {
			USA: 1500,
		},
		width: 800,
		height: 500,
	},
};

export const EmptyData: Story = {
	args: {
		data: {},
		width: 800,
		height: 500,
	},
};
