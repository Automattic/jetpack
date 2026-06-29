import { withChartTheme } from '../../../stories/with-chart-theme';
import { BarChart, type BarChartStyle } from '../bar-chart';
import type { SeriesData } from '@automattic/charts';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof BarChart > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/BarChart',
	component: BarChart,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'padded',
	},
	decorators: [
		withChartTheme,
		Story => (
			<div style={ { width: '100%', height: '300px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj< typeof BarChart >;

/**
 * Series styles using the styles prop (recommended approach).
 * Clean API where all styling is defined in one place.
 */
const STYLES: BarChartStyle[] = [
	{ stroke: '#3858E9' },
	{ stroke: '#3858E9' },
	{ stroke: '#3858E9' },
];

/**
 * Sample categorical chart data for sales by coupon
 */
const chartData: SeriesData[] = [
	{
		label: 'Dec 16, 2025-Jan 14, 2026',
		data: [
			{ label: 'summer', value: 4500 },
			{ label: 'welcome', value: 3200 },
			{ label: 'flash', value: 2800 },
		],
	},
];

/**
 * Sample categorical chart data with negative values (refunds)
 */
const withNegativeValues: SeriesData[] = [
	{
		label: 'Dec 16, 2025-Jan 14, 2026',
		data: [
			{ label: 'Product Sales', value: 15000 },
			{ label: 'Shipping', value: 2500 },
			{ label: 'Refunds', value: -3200 },
			{ label: 'Discounts', value: -1500 },
		],
	},
];

const longDataLabel: SeriesData[] = [
	{
		label: 'Dec 16, 2025-Jan 14, 2026',
		data: [
			{
				label: 'Very long data label that might need to be truncated',
				value: 15000,
			},
			{
				label: 'Another long data label that might need to be truncated',
				value: 2500,
			},
		],
	},
];

/**
 * Default: Vertical bar chart with categorical data
 */
export const Default: Story = {
	args: {
		chartData,
		dataFormat: { type: 'number' },
		styles: STYLES,
	},
};

/**
 * WithNegativeValues: Bar chart showing negative amounts (refunds)
 * This demonstrates the key feature of using bar charts for monetary widgets
 */
export const WithNegativeValues: Story = {
	args: {
		chartData: withNegativeValues,
		dataFormat: { type: 'currency' },
		styles: STYLES,
	},
};

/**
 * AllNegativeValues: Example showing all negative values
 */
export const AllNegativeValues: Story = {
	args: {
		chartData: [
			{
				label: 'Dec 16, 2025-Jan 14, 2026',
				data: [
					{ label: 'Defective', value: -5400 },
					{ label: 'Wrong Item', value: -3200 },
					{ label: 'Changed Mind', value: -2100 },
				],
			},
		],
		dataFormat: { type: 'currency' },
		styles: STYLES,
	},
};

/**
 * LongDataLabel: Bar chart with long data labels
 */
export const LongDataLabel: Story = {
	decorators: [
		Story => (
			<div
				style={ {
					width: 350,
				} }
			>
				<Story />
			</div>
		),
	],
	args: {
		chartData: longDataLabel,
		dataFormat: { type: 'number' },
		styles: STYLES,
	},
};

/**
 * CurrencyFormat: Bar chart with currency formatted tooltip
 */
export const CurrencyFormat: Story = {
	args: {
		chartData,
		dataFormat: { type: 'currency' },
		styles: STYLES,
	},
};

/**
 * PercentageFormat: Bar chart with percentage formatted tooltip
 */
export const PercentageFormat: Story = {
	args: {
		chartData: [
			{
				label: 'Dec 16, 2025-Jan 14, 2026',
				data: [
					{ label: 'Desktop', value: 0.045 },
					{ label: 'Mobile', value: 0.032 },
					{ label: 'Tablet', value: 0.028 },
				],
			},
		],
		dataFormat: { type: 'percentage' },
		styles: STYLES,
	},
};

/**
 * WithComparison: Bar chart with primary and comparison periods
 * Demonstrates multiple series with different colors
 */
export const WithComparison: Story = {
	args: {
		chartData: [
			{
				label: 'Dec 16, 2025-Jan 14, 2026',
				data: [
					{ label: 'summer', value: 4500 },
					{ label: 'welcome', value: 3200 },
					{ label: 'flash', value: 2800 },
				],
			},
			{
				label: 'Dec 16, 2024-Jan 14, 2025',
				data: [
					{ label: 'summer', value: 3800 },
					{ label: 'welcome', value: 2900 },
					{ label: 'flash', value: 3100 },
				],
			},
		],
		dataFormat: { type: 'currency' },
		styles: [
			{ stroke: '#3858E9' }, // Primary - Blueberry
			{ stroke: '#66BDFF' }, // Comparison - Blue 30
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					'Bar chart with two series comparing current and previous periods. Uses different blue shades to distinguish between periods.',
			},
		},
	},
};

/**
 * Resizable: Demonstrates auto-resize behavior
 */
export const Resizable: Story = {
	decorators: [
		Story => (
			<div
				style={ {
					width: 350,
					resize: 'both',
					overflow: 'auto',
					border: '1px dashed #ccc',
					padding: 16,
					minWidth: 250,
					maxWidth: 600,
					height: 350,
				} }
			>
				<Story />
			</div>
		),
	],
	args: {
		...WithComparison.args,
	},
};

/**
 * CustomStyles: Bar chart with custom green color applied via the `styles` prop
 */
export const CustomStyles: Story = {
	args: {
		chartData,
		dataFormat: { type: 'currency' },
		styles: [ { stroke: '#10B981' } ],
	},
	parameters: {
		docs: {
			description: {
				story: 'Bar chart with custom green color applied via the `styles` prop.',
			},
		},
	},
};

/**
 * ZeroValues: Bar chart with all zero values (tooltips disabled)
 * Demonstrates how the chart handles zero values gracefully by disabling tooltips
 */
export const ZeroValues: Story = {
	args: {
		chartData: [
			{
				label: 'Dec 16, 2025-Jan 14, 2026',
				data: [
					{ label: 'summer', value: 0 },
					{ label: 'welcome', value: 0 },
					{ label: 'flash', value: 0 },
				],
			},
		],
		dataFormat: { type: 'currency' },
		styles: STYLES,
	},
	parameters: {
		docs: {
			description: {
				story:
					'When all data values are 0, tooltips are automatically disabled to avoid showing meaningless "0" tooltips on hover.',
			},
		},
	},
};

/**
 * ComparisonWithZeroValues: Bar chart comparing current period with zero historical data
 * Demonstrates how charts handle new stores with no prior data to compare against.
 * Zero-value bars render with a small visible height for better UX.
 */
export const ComparisonWithZeroValues: Story = {
	args: {
		chartData: [
			{
				label: 'Dec 16, 2025-Jan 14, 2026',
				data: [
					{ label: 'New customers', value: 4500 },
					{ label: 'Returning', value: 3200 },
				],
			},
			{
				label: 'Dec 16, 2024-Jan 14, 2025',
				data: [
					{ label: 'New customers', value: 0 },
					{ label: 'Returning', value: 0 },
				],
			},
		],
		dataFormat: { type: 'currency' },
		styles: [
			{ stroke: '#3858E9' }, // Primary - Blueberry
			{ stroke: '#66BDFF' }, // Comparison - Blue 30
		],
		showZeroValues: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'When comparison period has zero values (e.g., new store with no prior data), zero-value bars render with a small visible height. This provides a visual cue and allows users to hover for tooltip confirmation.',
			},
		},
	},
};

/**
 * EmptyState: Bar chart with no data available
 * Demonstrates the empty state message when there's no data to display
 */
export const EmptyState: Story = {
	args: {
		chartData: [],
		dataFormat: { type: 'currency' },
		styles: STYLES,
	},
	parameters: {
		docs: {
			description: {
				story:
					'When no data is available, an empty state message is displayed instead of the chart.',
			},
		},
	},
};
