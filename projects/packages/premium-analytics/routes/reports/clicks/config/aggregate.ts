/**
 * External dependencies
 */
import {
	aggregateStatsDrilldownRows,
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsClicksItem,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import type { ClickRow } from './fields';

/**
 * Convert a daily clicks report to a clicks-per-bucket time series.
 *
 * Top-level click groups already contain their children's totals, so only
 * top-level values are summed to avoid double-counting flattened child URLs.
 *
 * @param report - The daily clicks report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function clicksToTimeSeries(
	report: StatsNormalizedReport< StatsClicksItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const clicks = point.items.reduce( ( total, item ) => total + item.views, 0 );

		return { value: clicks, clicks };
	} );
}

/**
 * Aggregate bucketed click groups into nested rows: one parent row per click
 * group with its clicked URLs as child rows, in display order.
 *
 * @param report - The bucketed clicks report.
 * @return Nested click rows in display order.
 */
export function aggregateClickRows(
	report?: StatsNormalizedReport< StatsClicksItem >
): ClickRow[] {
	return aggregateStatsDrilldownRows( report ).map( row => ( {
		id: row.id,
		parentId: row.parentId,
		// Leaf rows show the full clicked URL; group rows show the group label.
		clickedUrl: row.href ?? row.label,
		href: row.href,
		isGroup: row.isGroup,
		clicks: row.value,
	} ) );
}
