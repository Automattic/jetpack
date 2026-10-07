/**
 * External dependencies
 */
import {
	type SeriesData,
	type DataPointDate,
	type LineStyles,
} from '@jetpack-premium-analytics/externals';
import type { CountLabel, DataFormat } from '../../types';

/**
 * Types
 */
export type ComparativeDatePointDate = DataPointDate & {
	date: Date; // <- date is required by the comparative line chart.
	realDate?: Date;
	/** The last instant of the point's own bucket, which `alignSeriesDates` never moves. */
	endDate?: Date;
};

export type ComparativeLineChartSeries = SeriesData & {
	// We expect SeriesData.data to be an array of DataPointDate.
	data: ComparativeDatePointDate[];
	/** A comparison series reads its group's, as it does the group's name. */
	countLabel?: CountLabel;
};

/**
 * A series the tooltip reads out but the chart does not draw: its point for the
 * hovered date joins the rows, named after `label` and formatted its own way.
 */
export type TooltipExtraSeries = {
	label: string;
	/**
	 * The comparison period's points, each placed on the current period's date with
	 * its own in `realDate`. Read right after the current row, under the same label.
	 */
	previous?: ComparativeDatePointDate[];
	data: ComparativeDatePointDate[];
	/** Falls back to the chart's `dataFormat`. */
	dataFormat?: DataFormat;
	countLabel?: CountLabel;
};

/**
 * Style configuration for a single series.
 * Derived from LineStyles (SVG line attributes) with required stroke.
 */
export type SeriesStyle = LineStyles & {
	/** Line stroke color (required) */
	stroke: string;
};
