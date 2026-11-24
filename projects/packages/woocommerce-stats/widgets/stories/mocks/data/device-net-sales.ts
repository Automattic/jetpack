/**
 * Internal dependencies
 */
import {
	bucketsForWindow,
	dailyTrend,
	dayIndexOf,
	money,
	type DailyTrend,
	type ReportBucket,
} from './interval-buckets';

const netSalesOf = ( trend: DailyTrend, bucket: ReportBucket ) =>
	dailyTrend( trend )( bucket.dayIndex ) * ( dayIndexOf( bucket.date_end ) - bucket.dayIndex + 1 );

/**
 * The window a report request asks for, read from the query params that name its bounds.
 *
 * @param {URLSearchParams} query   - The request's query params.
 * @param {string}          fromKey - The param holding the window's start.
 * @param {string}          toKey   - The param holding the window's end.
 * @return {URLSearchParams} The window's `from`, `to` and `interval`.
 */
export const windowOf = ( query: URLSearchParams, fromKey: string, toKey: string ) =>
	new URLSearchParams( {
		from: query.get( fromKey ) ?? '',
		to: query.get( toKey ) ?? '',
		interval: query.get( 'interval' ) ?? 'day',
	} );

/**
 * One device's net sales for a window: its share of each bucket's net sales, and their sum.
 *
 * @param {URLSearchParams} windowQuery - The window's `from`, `to` and `interval`.
 * @param {DailyTrend}      trend       - The store's daily net sales.
 * @param {number}          share       - The device's share of the store's net sales.
 * @return {object} The value and intervals, as the live endpoint sends them.
 */
export function deviceNetSales( windowQuery: URLSearchParams, trend: DailyTrend, share: number ) {
	const intervals = bucketsForWindow( windowQuery ).map( bucket => ( {
		time_interval: bucket.time_interval,
		date_start: bucket.date_start,
		date_end: bucket.date_end,
		net_sales: money( netSalesOf( trend, bucket ) * share ),
	} ) );

	return {
		value: money(
			intervals.reduce( ( total, interval ) => total + Number( interval.net_sales ), 0 )
		),
		intervals,
	};
}
