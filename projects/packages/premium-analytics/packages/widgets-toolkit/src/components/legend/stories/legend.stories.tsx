import { MetricDelta } from '../../metric-delta';
import { Legend, type LegendItem } from '../legend';
import { LegendRow } from '../row';
import type { ReactNode } from 'react';

/**
 * Default color palette for stories
 */
const STORY_COLORS = [
	'#3858E9', // Blueberry
	'#66BDFF', // Blue 30
	'#A77EFF', // Purple 30
	'#7B90FF',
	'#EB6594',
];

const sampleItems: LegendItem[] = [
	{
		label: 'Mobile',
		value: 241950,
		displayValue: 'R$ 241.95K',
		color: STORY_COLORS[ 0 ],
	},
	{
		label: 'Desktop',
		value: 148130,
		displayValue: 'R$ 148.13K',
		color: STORY_COLORS[ 1 ],
	},
	{
		label: 'Tablet',
		value: 44740,
		displayValue: 'R$ 44.74K',
		color: STORY_COLORS[ 2 ],
	},
];

const sampleItemsWithComparison: LegendItem[] = [
	{
		label: 'Mobile',
		value: 241950,
		displayValue: 'R$ 241.95K',
		color: STORY_COLORS[ 0 ],
		comparison: 200000,
	},
	{
		label: 'Desktop',
		value: 148130,
		displayValue: 'R$ 148.13K',
		color: STORY_COLORS[ 1 ],
		comparison: 160000,
	},
	{
		label: 'Tablet',
		value: 44740,
		displayValue: 'R$ 44.74K',
		color: STORY_COLORS[ 2 ],
		comparison: 44740,
	},
];

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/Legend',
	component: Legend,
	tags: [ 'autodocs' ],
};

export default meta;

/**
 * Default legend with items
 */
export const Default = {
	args: {
		items: sampleItems,
	},
};

/**
 * Legend with comparison deltas
 */
export const WithComparison = {
	args: {
		items: sampleItemsWithComparison,
		withComparison: true,
	},
};

/**
 * Legend with hidden values - shows only labels and comparison deltas.
 * Useful for widgets like Sales by Coupon where absolute values
 * are already shown in the chart.
 */
export const HiddenValues = {
	args: {
		items: sampleItemsWithComparison,
		withComparison: true,
		hideValue: true,
	},
};

/**
 * Grid wrapper to properly display LegendRow (which returns a Fragment)
 */
function GridWrapper( { children }: { children: ReactNode } ) {
	return (
		<div
			style={ {
				display: 'inline-grid',
				gridTemplateColumns: '1fr auto auto',
				gap: '4px 16px',
				alignItems: 'center',
			} }
		>
			{ children }
		</div>
	);
}

/**
 * LegendRow: Basic row with label and value
 */
export const Row = {
	render: () => (
		<GridWrapper>
			<LegendRow value="$1,234.56" color="#3858E9">
				Item Label
			</LegendRow>
		</GridWrapper>
	),
};

/**
 * LegendRow: With positive comparison delta
 */
export const RowWithPositiveComparison = {
	render: () => (
		<GridWrapper>
			<LegendRow
				value="$45,678"
				color="#3858E9"
				comparison={ <MetricDelta current={ 45678 } previous={ 40000 } /> }
			>
				Revenue
			</LegendRow>
		</GridWrapper>
	),
};

/**
 * LegendRow: With negative comparison delta
 */
export const RowWithNegativeComparison = {
	render: () => (
		<GridWrapper>
			<LegendRow
				value="$2,345"
				color="#EB6594"
				comparison={ <MetricDelta current={ 2345 } previous={ 3000 } /> }
			>
				Returns
			</LegendRow>
		</GridWrapper>
	),
};

/**
 * Resizable container wrapper for testing responsive behavior.
 */
function ResizableWrapper( { children }: { children: ReactNode } ) {
	return (
		<div
			style={ {
				width: 164,
				resize: 'horizontal',
				overflow: 'auto',
				border: '1px dashed #ccc',
				padding: 8,
				minWidth: 120,
				maxWidth: 400,
			} }
		>
			{ children }
		</div>
	);
}

/**
 * Items with long labels to test text overflow behavior
 */
const longLabelItems: LegendItem[] = [
	{
		label: 'Desktop Computer',
		value: 85000,
		displayValue: '$85.142,00',
		color: STORY_COLORS[ 0 ],
		comparison: 80000,
	},
	{
		label: 'Mobile Phone',
		value: 45000,
		displayValue: '$ 45.086,60',
		color: STORY_COLORS[ 1 ],
		comparison: 40000,
	},
	{
		label: 'Tablet Device',
		value: 15000,
		displayValue: '$ 15.023,10',
		color: STORY_COLORS[ 2 ],
		comparison: 18000,
	},
];

/**
 * Resizable: Legend with comparison in narrow container.
 * Tests how delta indicators behave when space is limited.
 */
export const Resizable = {
	render: () => (
		<ResizableWrapper>
			<Legend items={ longLabelItems } withComparison={ true } />
		</ResizableWrapper>
	),
};

/**
 * Items with dash fallback - when previous is 0 and current is not,
 * a dash is shown instead of percentage (can't calculate % from zero).
 */
const itemsWithDashFallback: LegendItem[] = [
	{
		label: 'Mobile',
		value: 104000,
		displayValue: '$104K',
		color: STORY_COLORS[ 0 ],
		comparison: 5000, // Normal: +1980%
	},
	{
		label: 'Unassigned',
		value: 69000,
		displayValue: '$69K',
		color: STORY_COLORS[ 1 ],
		comparison: 12000, // Normal: +475%
	},
	{
		label: 'Desktop',
		value: 28000,
		displayValue: '$28K',
		color: STORY_COLORS[ 2 ],
		comparison: 0, // Dash fallback: previous is 0
	},
	{
		label: 'Tablet',
		value: 15000,
		displayValue: '$15K',
		color: STORY_COLORS[ 3 ],
		comparison: 0, // Dash fallback: previous is 0
	},
];

/**
 * WithComparisonDashFallback: Tests dash alignment with percentage values.
 * When previous period value is 0, a dash "—" is shown instead of percentage.
 * The dash should be right-aligned with the other delta percentages.
 */
export const WithComparisonDashFallback = {
	args: {
		items: itemsWithDashFallback,
		withComparison: true,
	},
};
