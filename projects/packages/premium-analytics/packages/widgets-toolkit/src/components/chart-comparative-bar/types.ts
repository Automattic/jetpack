/**
 * Internal dependencies
 */
import type { ComparativeLineChartSeries } from '../chart-comparative-line/types';

/**
 * One bar series. An alias rather than its own shape: both comparative charts plot a
 * date-keyed time series and run comparison points through `alignSeriesDates`, so a
 * separate declaration would only be free to drift from what that helper accepts.
 */
export type ComparativeBarChartSeries = ComparativeLineChartSeries;
