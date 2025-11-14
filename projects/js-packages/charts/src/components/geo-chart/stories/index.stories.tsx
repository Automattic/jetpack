import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
	ordersByCountry,
	viewsByCity,
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
	decorators: [ chartDecorator ],
	argTypes: {
		data: {
			control: 'object',
			description: 'Record mapping country ISO codes to numeric values',
			table: {
				type: { summary: 'Record<string, number>' },
			},
		},
		citiesData: {
			control: 'object',
			description: 'Array of city data with coordinates and values',
			table: {
				type: { summary: 'CityData[]' },
			},
		},
		view: {
			control: 'radio',
			options: [ 'countries', 'regions', 'cities' ],
			description: 'Current view type',
			table: {
				type: { summary: 'ViewType' },
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

export const CitiesView: Story = {
	args: {
		data: ordersByCountry,
		citiesData: viewsByCity,
		view: 'cities',
		width: 800,
		height: 500,
	},
};

export const InteractiveViewSwitching: Story = {
	args: {
		data: ordersByCountry,
		citiesData: viewsByCity,
		width: 800,
		height: 500,
	},
};
