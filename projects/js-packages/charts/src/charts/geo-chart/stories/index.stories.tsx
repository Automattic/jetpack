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

export const Default: Story = {
	args: {
		...geoChartStoryArgs,
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
		...Default.args,
		data: [
			[ 'Country', 'Views' ],
			[ 'United States', 1500 ],
		],
	},
};

export const EmptyData: Story = {
	args: {
		...Default.args,
		data: [ [ 'Country', 'Views' ] ],
	},
};

export const USStates: Story = {
	args: {
		...Default.args,
		region: 'US',
		resolution: 'provinces',
		data: viewsByUSState,
	},
};

export const EuropeanCountries: Story = {
	args: {
		...Default.args,
		region: '150',
		resolution: 'countries',
		data: viewsByEuropeanCountry,
	},
};

export const WithAspectRatio: Story = {
	args: {
		...Default.args,
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
