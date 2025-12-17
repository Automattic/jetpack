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
		data: [
			[ 'State', 'Views' ],
			[ 'California', 2500 ],
			[ 'Texas', 1800 ],
			[ 'Florida', 1500 ],
			[ 'New York', 1400 ],
			[ 'Illinois', 900 ],
			[ 'Pennsylvania', 850 ],
			[ 'Ohio', 750 ],
			[ 'Georgia', 700 ],
			[ 'North Carolina', 650 ],
			[ 'Michigan', 600 ],
			[ 'Washington', 550 ],
			[ 'Arizona', 500 ],
			[ 'Massachusetts', 480 ],
			[ 'Colorado', 450 ],
			[ 'Virginia', 420 ],
		],
	},
};
