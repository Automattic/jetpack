import { viewsByEuropeanCountry, viewsByUSState } from '../../../stories/sample-data';
import GeoChart from '../geo-chart';
import { geoChartMetaArgs, geoChartStoryArgs } from './config';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof GeoChart > = {
	...geoChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Geo Chart',
};

export default meta;
type Story = StoryObj< typeof GeoChart >;

export const Default: Story = {
	args: {
		...geoChartStoryArgs,
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
