/**
 * External dependencies
 */
import { type SeriesData, type DataPointDate, type LineStyles } from '@automattic/charts';

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
 * Style configuration for a single series.
 * Derived from LineStyles (SVG line attributes) with required stroke.
 */
export type SeriesStyle = LineStyles & {
	/** Line stroke color (required) */
	stroke: string;
};
