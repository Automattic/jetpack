import { GoogleDataTableColumnRoleType } from '../../../types';
import GeoChart from '../geo-chart';
import { geoChartMetaArgs, geoChartStoryArgs } from './config';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof GeoChart > = {
	...geoChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Geo Chart/Tooltips',
	component: geoChartMetaArgs.component, // Make eslint happy.
};

export default meta;
type Story = StoryObj< typeof GeoChart >;

export const FormattedValues: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Revenue' ],
			[ 'United States', { v: 1234567, f: '$1.23M' } ],
			[ 'Canada', { v: 543210, f: '$543K' } ],
			[ 'United Kingdom', { v: 789012, f: '$789K' } ],
			[ 'Germany', { v: 456789, f: '$457K' } ],
			[ 'France', { v: 321098, f: '$321K' } ],
		],
	},
};

export const PlainText: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Orders', { type: 'string', role: GoogleDataTableColumnRoleType.tooltip } ],
			[ 'United States', 1000, '1,000 orders (40% of total)' ],
			[ 'Canada', 500, '500 orders (20% of total)' ],
			[ 'United Kingdom', 450, '450 orders (18% of total)' ],
			[ 'Germany', 400, '400 orders (16% of total)' ],
			[ 'France', 150, '150 orders (6% of total)' ],
		],
	},
};

export const HTML: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[
				'Country',
				'Orders',
				{ type: 'string', role: GoogleDataTableColumnRoleType.tooltip, p: { html: true } },
			],
			[ 'United States', 1000, 'Orders: <strong>1,000</strong><br/>Share: <strong>40%</strong>' ],
			[ 'Canada', 500, 'Orders: <strong>500</strong><br/>Share: <strong>20%</strong>' ],
			[ 'United Kingdom', 450, 'Orders: <strong>450</strong><br/>Share: <strong>18%</strong>' ],
		],
	},
};
