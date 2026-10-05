/**
 * External dependencies
 */
import {
	type SeriesData,
	type DataPointDate,
	type LineStyles,
} from '@jetpack-premium-analytics/externals';
import type { CountLabel, DataFormat } from '../../types';
import type { ReactElement } from 'react';

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
	/** A comparison series reads its group's, as it does the group's name. */
	countLabel?: CountLabel;
};

/**
 * A series the tooltip reads out but the chart does not draw: its point for the
 * hovered date joins the rows, named after `label` and formatted its own way.
 */
export type TooltipExtraSeries = {
	label: string;
	/** A `@wordpress/icons` icon, drawn in place of a series swatch since the chart draws no mark for the row. */
	icon?: ReactElement;
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
