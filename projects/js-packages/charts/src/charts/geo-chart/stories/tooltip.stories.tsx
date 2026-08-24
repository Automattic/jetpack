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

export const HTML: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[
				'Country',
				'Orders',
				{ type: 'string', role: GoogleDataTableColumnRoleType.tooltip, p: { html: true } },
			],
			[ 'United States', 1000, '<b>United States</b><br/>1,000 orders' ],
			[ 'Canada', 500, '<b>Canada</b><br/>500 orders' ],
			[ 'United Kingdom', 450, '<b>United Kingdom</b><br/>450 orders' ],
			[ 'Germany', 400, '<b>Germany</b><br/>400 orders' ],
		],
	},
};

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
			[ 'United States', 1000, 'United States: 1,000 orders (40% of total)' ],
			[ 'Canada', 500, 'Canada: 500 orders (20% of total)' ],
			[ 'United Kingdom', 450, 'United Kingdom: 450 orders (18% of total)' ],
			[ 'Germany', 400, 'Germany: 400 orders (16% of total)' ],
			[ 'France', 150, 'France: 150 orders (6% of total)' ],
		],
	},
};

export const Complex: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[
				'Country',
				'Orders',
				{ type: 'string', role: GoogleDataTableColumnRoleType.tooltip, p: { html: true } },
			],
			[
				'United States',
				1000,
				`<div style="padding: 12px; font-family: sans-serif;">
					<div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">🇺🇸 United States</div>
					<div style="color: #666;">Orders: <strong>1,000</strong></div>
					<div style="color: #666;">Share: <strong>40%</strong></div>
				</div>`,
			],
			[
				'Canada',
				500,
				`<div style="padding: 12px; font-family: sans-serif;">
					<div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">🇨🇦 Canada</div>
					<div style="color: #666;">Orders: <strong>500</strong></div>
					<div style="color: #666;">Share: <strong>20%</strong></div>
				</div>`,
			],
			[
				'United Kingdom',
				450,
				`<div style="padding: 12px; font-family: sans-serif;">
					<div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">🇬🇧 United Kingdom</div>
					<div style="color: #666;">Orders: <strong>450</strong></div>
					<div style="color: #666;">Share: <strong>18%</strong></div>
				</div>`,
			],
		],
	},
};
