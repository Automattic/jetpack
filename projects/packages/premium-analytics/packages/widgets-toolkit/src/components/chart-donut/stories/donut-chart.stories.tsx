import { withChartTheme } from '../../../stories/with-chart-theme';
import { DonutChart } from '../donut-chart';
import type { SegmentStyle } from '../../../helpers';
import type { LegendItem } from '../../legend/legend';
import type { DonutChartData } from '../donut-chart';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DonutChart > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/DonutChart',
	component: DonutChart,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'padded',
	},
	decorators: [ withChartTheme ],
};

export default meta;
type Story = StoryObj< typeof DonutChart >;

/**
 * Segment styles using the styles prop (recommended approach).
 */
const SEGMENT_STYLES: SegmentStyle[] = [
	{ color: '#3858E9' }, // Blueberry
	{ color: '#66BDFF' }, // Blue 30
	{ color: '#A77EFF' }, // Purple 30
];

/**
 * Extended segment styles for 5 items.
 */
const SEGMENT_STYLES_5: SegmentStyle[] = [
	{ color: '#3858E9' }, // Blueberry
	{ color: '#66BDFF' }, // Blue 30
	{ color: '#A77EFF' }, // Purple 30
	{ color: '#F2D675' }, // Yellow 20
	{ color: '#7BDCB5' }, // Green 30
];

/**
 * Sample chart data
 */
const chartData: DonutChartData = [
	{ label: 'Completed', value: 45 },
	{ label: 'Pending', value: 25 },
	{ label: 'Cancelled', value: 10 },
];

/**
 * Sample legend data (without comparison)
 */
const legendData: LegendItem[] = [
	{ label: 'Completed', value: 45, displayValue: '45' },
	{ label: 'Pending', value: 25, displayValue: '25' },
	{ label: 'Cancelled', value: 10, displayValue: '10' },
];

/**
 * Sample legend data with comparison values
 */
const legendDataWithComparison: LegendItem[] = [
	{ label: 'Completed', value: 45, displayValue: '45', comparison: 42 },
	{ label: 'Pending', value: 25, displayValue: '25', comparison: 30 },
	{ label: 'Cancelled', value: 10, displayValue: '10', comparison: 8 },
];

/**
 * Default: Chart only, colors via styles prop.
 */
export const Default: Story = {
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 80,
		dataFormat: { type: 'number' },
	},
};

/**
 * WithLegend: Chart with legend below.
 */
export const WithLegend: Story = {
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 80,
		legendData,
		showLegend: true,
		dataFormat: { type: 'number' },
	},
};

/**
 * WithComparison: Chart with comparison value showing positive delta.
 */
export const WithComparison: Story = {
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 80,
		comparisonValue: 72,
		legendData: legendDataWithComparison,
		showLegend: true,
		dataFormat: { type: 'number' },
	},
};

/**
 * NegativeComparison: Chart with comparison value showing negative delta.
 */
export const NegativeComparison: Story = {
	args: {
		chartData: [
			{ label: 'Completed', value: 35 },
			{ label: 'Pending', value: 20 },
			{ label: 'Cancelled', value: 15 },
		],
		styles: SEGMENT_STYLES,
		value: 70,
		comparisonValue: 80,
		legendData: [
			{
				label: 'Completed',
				value: 35,
				displayValue: '35',
				comparison: 45,
			},
			{
				label: 'Pending',
				value: 20,
				displayValue: '20',
				comparison: 25,
			},
			{
				label: 'Cancelled',
				value: 15,
				displayValue: '15',
				comparison: 10,
			},
		],
		showLegend: true,
		dataFormat: { type: 'number' },
	},
};

/**
 * CurrencyFormat: Donut chart with currency formatted values.
 */
export const CurrencyFormat: Story = {
	args: {
		chartData: [
			{ label: 'Online Sales', value: 45000 },
			{ label: 'In-store Sales', value: 25000 },
			{ label: 'Returns', value: 10000 },
		],
		styles: SEGMENT_STYLES,
		value: 80000,
		comparisonValue: 72000,
		legendData: [
			{
				label: 'Online Sales',
				value: 45000,
				displayValue: '$45K',
				comparison: 42000,
			},
			{
				label: 'In-store Sales',
				value: 25000,
				displayValue: '$25K',
				comparison: 22000,
			},
			{
				label: 'Returns',
				value: 10000,
				displayValue: '$10K',
				comparison: 8000,
			},
		],
		showLegend: true,
		dataFormat: {
			type: 'currency',
			options: { useMultipliers: true, decimals: 0 },
		},
	},
};

/**
 * Resizable: Demonstrates auto-resize behavior.
 * Drag the container edges to see the chart adapt to different widths.
 */
export const Resizable: Story = {
	decorators: [
		Story => (
			<div
				style={ {
					width: 300,
					resize: 'both',
					overflow: 'auto',
					border: '1px dashed #ccc',
					padding: 16,
					minWidth: 200,
					maxWidth: 500,
				} }
			>
				<Story />
			</div>
		),
	],
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 80,
		comparisonValue: 72,
		legendData: legendDataWithComparison,
		showLegend: true,
		dataFormat: { type: 'number' },
	},
};

/**
 * SmallContainer: Chart in a narrow 200px container.
 */
export const SmallContainer: Story = {
	decorators: [
		Story => (
			<div style={ { width: 200 } }>
				<Story />
			</div>
		),
	],
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 80,
		comparisonValue: 72,
		legendData: legendDataWithComparison,
		showLegend: true,
		dataFormat: { type: 'number' },
	},
};

/**
 * LargeContainer: Chart stretches to fill a 400px container.
 */
export const LargeContainer: Story = {
	decorators: [
		Story => (
			<div style={ { width: 400 } }>
				<Story />
			</div>
		),
	],
	args: {
		chartData: [
			{ label: 'Completed', value: 45 },
			{ label: 'Pending', value: 25 },
			{ label: 'Cancelled', value: 10 },
			{ label: 'Refunded', value: 8 },
			{ label: 'On Hold', value: 2 },
		],
		styles: SEGMENT_STYLES_5,
		value: 90,
		comparisonValue: 82,
		legendData: [
			{
				label: 'Completed',
				value: 45,
				displayValue: '45',
				comparison: 42,
			},
			{
				label: 'Pending',
				value: 25,
				displayValue: '25',
				comparison: 21,
			},
			{
				label: 'Cancelled',
				value: 10,
				displayValue: '10',
				comparison: 11,
			},
			{
				label: 'Refunded',
				value: 8,
				displayValue: '8',
				comparison: 6,
			},
			{
				label: 'On Hold',
				value: 2,
				displayValue: '2',
				comparison: 2,
			},
		],
		showLegend: true,
		dataFormat: { type: 'number' },
	},
};

/**
 * BookingsByStatus: Real-world example for booking status distribution.
 */
export const BookingsByStatus: Story = {
	args: {
		chartData: [
			{ label: 'Confirmed', value: 120 },
			{ label: 'Pending', value: 45 },
			{ label: 'Cancelled', value: 15 },
		],
		styles: [
			{ color: '#36B37E' }, // Green for confirmed
			{ color: '#FFAB00' }, // Yellow for pending
			{ color: '#FF5630' }, // Red for cancelled
		],
		value: 180,
		comparisonValue: 165,
		legendData: [
			{
				label: 'Confirmed',
				value: 120,
				displayValue: '120',
				comparison: 110,
			},
			{
				label: 'Pending',
				value: 45,
				displayValue: '45',
				comparison: 40,
			},
			{
				label: 'Cancelled',
				value: 15,
				displayValue: '15',
				comparison: 15,
			},
		],
		showLegend: true,
		dataFormat: { type: 'number' },
	},
};

/**
 * NewVsReturning: Real-world example for customer segmentation.
 */
export const NewVsReturning: Story = {
	args: {
		chartData: [
			{ label: 'New customers', value: 340 },
			{ label: 'Returning', value: 660 },
		],
		styles: [
			{ color: '#3858E9' }, // Blue for new
			{ color: '#A77EFF' }, // Purple for returning
		],
		value: 1000,
		comparisonValue: 920,
		legendData: [
			{
				label: 'New customers',
				value: 340,
				displayValue: '340',
				comparison: 300,
			},
			{
				label: 'Returning',
				value: 660,
				displayValue: '660',
				comparison: 620,
			},
		],
		showLegend: true,
		dataFormat: { type: 'number' },
	},
};

/**
 * EmptyState: Shows the empty state with default icon when no data is available.
 */
export const EmptyState: Story = {
	args: {
		chartData: [],
		styles: SEGMENT_STYLES,
		value: 0,
		dataFormat: { type: 'number' },
	},
};

/**
 * WithTooltips: Chart with tooltips enabled on hover.
 * Hover over segments to see tooltips with label and value.
 */
export const WithTooltips: Story = {
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 80,
		comparisonValue: 72,
		legendData: legendDataWithComparison,
		showLegend: true,
		dataFormat: { type: 'number' },
		withTooltips: true,
	},
};
