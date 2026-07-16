/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsNormalizedReport,
	type StatsTagsItem,
	type StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';

/**
 * Resolve the stable identity shared by a tag/category row across report buckets.
 *
 * @param item - The normalized tag/category row.
 * @return Stable row key.
 */
export function getTagRowId( item: StatsTagsItem ): string {
	return item.link ?? item.labelText;
}

/**
 * Build the chart's views-per-bucket time series from daily tags data.
 *
 * @param report - The bucketed tags report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function tagsToTimeSeries(
	report: StatsNormalizedReport< StatsTagsItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const views = point.items.reduce( ( total, item ) => total + item.value, 0 );

		return { value: views, views };
	} );
}

/**
 * Aggregate one bucketed report into one table row per tag/category, summing
 * views across buckets without mutating query data.
 *
 * @param report - The bucketed tags report.
 * @return Aggregated tag/category rows.
 */
export function aggregateTagRows(
	report: StatsNormalizedReport< StatsTagsItem > | undefined
): StatsTagsItem[] {
	const byKey = new Map< string, StatsTagsItem >();

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const key = getTagRowId( item );
			const existing = byKey.get( key );

			if ( existing ) {
				existing.value += item.value;
			} else {
				byKey.set( key, {
					...item,
					label: [ ...item.label ],
					children: item.children ? item.children.map( child => ( { ...child } ) ) : undefined,
				} );
			}
		}
	}

	return [ ...byKey.values() ];
}
