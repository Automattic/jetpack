/**
 * External dependencies
 */
import {
	type SeriesData,
	type DataPointDate,
	type LineStyles,
} from '@jetpack-premium-analytics/externals';
import type { DataFormat } from '../../types';

/**
 * Types
 */
export type ComparativeDatePointDate = DataPointDate & {
	date: Date; // <- date is required by the comparative line chart.
	realDate?: Date;
};

export type ComparativeLineChartSeries = SeriesData & {
	// We expect SeriesData.data to be an array of DataPointDate.
	data: ComparativeDatePointDate[];
};

/**
 * A series the tooltip reads out but the chart does not draw: its point for the
 * hovered date joins the rows, named after `label` and formatted its own way.
 * With any listed, every row leads with its metric's name, so the drawn one is
 * not mistaken for the only one; the names are set per chart, so that holds at
 * a date the extras have no point for.
 */
export type TooltipExtraSeries = {
	label: string;
	data: ComparativeDatePointDate[];
	/** Falls back to the chart's `dataFormat`. */
	dataFormat?: DataFormat;
};

/**
 * Style configuration for a single series.
 * Derived from LineStyles (SVG line attributes) with required stroke.
 */
export type SeriesStyle = LineStyles & {
	/** Line stroke color (required) */
	stroke: string;
};
