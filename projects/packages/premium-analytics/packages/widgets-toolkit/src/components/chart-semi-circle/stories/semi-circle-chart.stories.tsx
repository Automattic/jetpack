import { withChartTheme } from '../../../stories/with-chart-theme';
import { SemiCircleChart } from '../semi-circle-chart';
import type { SegmentStyle } from '../../../helpers';
import type { LegendItem } from '../../legend/legend';
import type { SemiCircleChartData } from '../semi-circle-chart';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof SemiCircleChart > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/SemiCircleChart',
	component: SemiCircleChart,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'padded',
	},
	decorators: [ withChartTheme ],
};

export default meta;
type Story = StoryObj< typeof SemiCircleChart >;

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
const chartData: SemiCircleChartData = [
	{ label: 'Mobile', value: 4500 },
	{ label: 'Desktop', value: 2500 },
	{ label: 'Tablet', value: 1000 },
];

/**
 * Sample legend data (without comparison)
 */
const legendData: LegendItem[] = [
	{ label: 'Mobile', value: 4500, displayValue: '4.5K' },
	{ label: 'Desktop', value: 2500, displayValue: '2.5K' },
	{ label: 'Tablet', value: 1000, displayValue: '1K' },
];

/**
 * Sample legend data with comparison values
 */
const legendDataWithComparison: LegendItem[] = [
	{ label: 'Mobile', value: 4500, displayValue: '4.5K', comparison: 4200 },
	{ label: 'Desktop', value: 2500, displayValue: '2.5K', comparison: 2100 },
	{ label: 'Tablet', value: 1000, displayValue: '1K', comparison: 1150 },
];

/**
 * Default: Chart only, colors via styles prop.
 */
export const Default: Story = {
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 8000,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
	},
};

/**
 * WithLegend: Chart with legend below.
 */
export const WithLegend: Story = {
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 8000,
		legendData,
		showLegend: true,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
	},
};

/**
 * WithComparison: Chart with comparison value showing positive delta.
 */
export const WithComparison: Story = {
	args: {
		chartData,
		styles: SEGMENT_STYLES,
		value: 8000,
		comparisonValue: 7450,
		legendData: legendDataWithComparison,
		showLegend: true,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
	},
};

/**
 * NegativeComparison: Chart with comparison value showing negative delta.
 */
export const NegativeComparison: Story = {
	args: {
		chartData: [
			{ label: 'Mobile', value: 3500 },
			{ label: 'Desktop', value: 2000 },
			{ label: 'Tablet', value: 1000 },
		],
		styles: SEGMENT_STYLES,
		value: 6500,
		comparisonValue: 8000,
		legendData: [
			{
				label: 'Mobile',
				value: 3500,
				displayValue: '3.5K',
				comparison: 4500,
			},
			{
				label: 'Desktop',
				value: 2000,
				displayValue: '2K',
				comparison: 2500,
			},
			{
				label: 'Tablet',
				value: 1000,
				displayValue: '1K',
				comparison: 1000,
			},
		],
		showLegend: true,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
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
					resize: 'horizontal',
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
		value: 8000,
		comparisonValue: 7450,
		legendData: legendDataWithComparison,
		showLegend: true,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
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
		value: 8000,
		comparisonValue: 7450,
		legendData: legendDataWithComparison,
		showLegend: true,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
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
			{ label: 'Mobile', value: 4500 },
			{ label: 'Desktop', value: 2500 },
			{ label: 'Tablet', value: 1000 },
			{ label: 'Smart TV', value: 800 },
			{ label: 'Other', value: 200 },
		],
		styles: SEGMENT_STYLES_5,
		value: 9000,
		comparisonValue: 8200,
		legendData: [
			{
				label: 'Mobile',
				value: 4500,
				displayValue: '4.5K',
				comparison: 4200,
			},
			{
				label: 'Desktop',
				value: 2500,
				displayValue: '2.5K',
				comparison: 2100,
			},
			{
				label: 'Tablet',
				value: 1000,
				displayValue: '1K',
				comparison: 1150,
			},
			{
				label: 'Smart TV',
				value: 800,
				displayValue: '800',
				comparison: 600,
			},
			{
				label: 'Other',
				value: 200,
				displayValue: '200',
				comparison: 150,
			},
		],
		showLegend: true,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
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
		dataFormat: { type: 'number', options: { useMultipliers: true } },
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
		value: 8000,
		comparisonValue: 7450,
		legendData: legendDataWithComparison,
		showLegend: true,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
		withTooltips: true,
	},
};
