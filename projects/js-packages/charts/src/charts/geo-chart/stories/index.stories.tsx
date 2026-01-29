import { viewsByEuropeanCountry, viewsByUSState } from '../../../stories/sample-data';
import GeoChart from '../geo-chart';
import { geoChartMetaArgs, geoChartStoryArgs } from './config';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof GeoChart > = {
	...geoChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Geo Chart',
	component: GeoChart,
};

export default meta;
type Story = StoryObj< typeof GeoChart >;

const responsiveArgs = { ...geoChartStoryArgs };
delete responsiveArgs.height;

export const Default: Story = {
	args: {
		...responsiveArgs,
		containerHeight: '400px',
		resize: 'both' as const,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Default responsive behavior. The chart fills its parent container. Resize the container to see how the chart adapts to any aspect ratio.',
			},
		},
	},
};

export const SingleCountry: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Views' ],
			[ 'United States', 1500 ],
		],
	},
};

export const EmptyData: Story = {
	args: {
		...geoChartStoryArgs,
		data: [ [ 'Country', 'Views' ] ],
	},
};

export const USStates: Story = {
	args: {
		...geoChartStoryArgs,
		region: 'US',
		resolution: 'provinces',
		data: viewsByUSState,
	},
};

export const EuropeanCountries: Story = {
	args: {
		...geoChartStoryArgs,
		region: '150',
		resolution: 'countries',
		data: viewsByEuropeanCountry,
	},
};

export const WithAspectRatio: Story = {
	args: {
		...responsiveArgs,
		aspectRatio: 0.5,
		resize: 'both' as const,
	},
	parameters: {
		docs: {
			description: {
				story:
					'When `aspectRatio` is provided, the chart height is calculated as `width * aspectRatio`. This maintains a consistent shape regardless of container size.',
			},
		},
	},
};
