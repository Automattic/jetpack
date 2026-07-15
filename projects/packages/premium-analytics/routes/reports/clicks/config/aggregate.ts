import type { ClickRow } from './fields';
import type {
	StatsClicksItem,
	StatsNormalizedReport,
	StatsPeriod,
	StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';

type ClicksChartPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * Map a daily bucket date onto its chart bucket key for the selected period.
 *
 * @param date   - The daily bucket date (`YYYY-MM-DD`).
 * @param period - The chart bucket period.
 * @return The bucket key the date aggregates into.
 */
function getChartBucketKey( date: string, period: ClicksChartPeriod ): string {
	if ( period === 'day' ) {
		return date;
	}

	const bucketDate = new Date( `${ date.slice( 0, 10 ) }T00:00:00Z` );

	if ( period === 'week' ) {
		const daysSinceMonday = ( bucketDate.getUTCDay() + 6 ) % 7;
		bucketDate.setUTCDate( bucketDate.getUTCDate() - daysSinceMonday );
	} else {
		bucketDate.setUTCDate( 1 );
	}

	return bucketDate.toISOString().slice( 0, 10 );
}

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
	period: ClicksChartPeriod = 'day'
): StatsTimeSeriesReport {
	const buckets = new Map< string, StatsTimeSeriesReport[ 'data' ][ number ] >();
	const points = [ ...( report?.data ?? [] ) ].sort( ( first, second ) =>
		first.time_interval.localeCompare( second.time_interval )
	);

	for ( const point of points ) {
		const clicks = point.items.reduce( ( total, item ) => total + item.views, 0 );
		const key = getChartBucketKey( point.time_interval, period );
		const existing = buckets.get( key );

		if ( existing ) {
			existing.date_end = point.date_end;
			existing.value = Number( existing.value ) + clicks;
			existing.clicks = Number( existing.clicks ) + clicks;
			continue;
		}

		buckets.set( key, {
			time_interval: key,
			date_start: point.date_start,
			date_end: point.date_end,
			label: key,
			items: [],
			value: clicks,
			clicks,
		} );
	}

	const data = [ ...buckets.values() ];
	const first = data[ 0 ];
	const last = data[ data.length - 1 ];

	return {
		summary: {
			...report?.summary,
			...( first ? { date_start: first.date_start } : {} ),
			...( last ? { date_end: last.date_end } : {} ),
		},
		data,
	};
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
