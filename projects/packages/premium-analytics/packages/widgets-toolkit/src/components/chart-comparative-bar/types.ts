/**
 * External dependencies
 */
import { type SeriesData } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import type { ComparativeDatePointDate } from '../chart-comparative-line/types';

/**
 * One bar series. Shares the comparative line chart's point shape: both charts
 * plot a date-keyed time series and both run comparison points through
 * `alignSeriesDates`, which is what populates `realDate`.
 */
export type ComparativeBarChartSeries = SeriesData & {
	// We expect SeriesData.data to be an array of DataPointDate.
	data: ComparativeDatePointDate[];
};

/**
 * Style configuration for a single bar series.
 *
 * Bars carry no dash pattern or line cap, so only the fill colour is needed.
 * It is named `stroke` to satisfy the shared `ChartTooltip` style contract,
 * which reads that field for the indicator swatch.
 */
export type BarSeriesStyle = {
	/** Bar fill color (required) */
	stroke: string;
};
