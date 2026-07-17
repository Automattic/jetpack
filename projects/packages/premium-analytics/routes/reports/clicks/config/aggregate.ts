/**
 * External dependencies
 */
import {
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
 * Flatten a click group to linked leaf rows.
 *
 * @param item  - The current click item.
 * @param group - The root click group label.
 * @return Linked leaf rows.
 */
function flattenClickItem( item: StatsClicksItem, group: string ): ClickRow[] {
	const children = item.children ?? [];

	if ( children.length ) {
		return children.flatMap( child => flattenClickItem( child, group ) );
	}

	if ( ! item.link ) {
		return [];
	}

	return [
		{
			id: `${ group }|${ item.link }`,
			clickedUrl: item.link,
			href: item.link,
			group,
			clicks: item.views,
		},
	];
}

/**
 * Aggregate bucketed click groups into one flat row per clicked URL.
 *
 * @param report - The bucketed clicks report.
 * @return Flat URL rows with their root click group.
 */
export function aggregateClickRows(
	report?: StatsNormalizedReport< StatsClicksItem >
): ClickRow[] {
	const byKey = new Map< string, ClickRow >();

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const group = String( item.label ?? '' );
			for ( const row of flattenClickItem( item, group ) ) {
				const existing = byKey.get( row.id );

				if ( existing ) {
					existing.clicks += row.clicks;
				} else {
					byKey.set( row.id, { ...row } );
				}
			}
		}
	}

	return [ ...byKey.values() ];
}
