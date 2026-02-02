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

// Stories referenced by index.docs.mdx
export const WithTextTooltips: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Orders', { type: 'string', role: 'tooltip' } ],
			[ 'United States', 1000, 'United States: 1,000 orders (40% of total)' ],
			[ 'Canada', 500, 'Canada: 500 orders (20% of total)' ],
			[ 'United Kingdom', 450, 'United Kingdom: 450 orders (18% of total)' ],
		],
	},
};

export const WithCustomTooltip: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Orders', { type: 'string', role: 'tooltip', p: { html: true } } ],
			[ 'United States', 1000, '<b>United States</b><br/>1,000 orders' ],
			[ 'Canada', 500, '<b>Canada</b><br/>500 orders' ],
		],
	},
};

export const WithFormattedValues: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Revenue' ],
			[ 'United States', { v: 1234567, f: '$1.23M' } ],
			[ 'Canada', { v: 543210, f: '$543K' } ],
			[ 'United Kingdom', { v: 789012, f: '$789K' } ],
		],
	},
};

export const WithComplexTooltips: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Orders', { type: 'string', role: 'tooltip', p: { html: true } } ],
			[
				'United States',
				1000,
				`<div style="padding: 12px; font-family: sans-serif;">
					<div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">🇺🇸 United States</div>
					<div style="color: #666;">Orders: <strong>1,000</strong></div>
					<div style="color: #666;">Share: <strong>40%</strong></div>
				</div>`,
			],
		],
	},
};

export const ConstrainedToParentHeight: Story = {
	args: {
		...geoChartStoryArgs,
		constrainToParentHeight: false,
		aspectRatio: 0.6,
		/**
		 * Remove the height prop to allow the chart to fill the parent container.
		 */
		height: undefined,
		containerWidth: '500px',
		containerHeight: '200px',
	},
};
