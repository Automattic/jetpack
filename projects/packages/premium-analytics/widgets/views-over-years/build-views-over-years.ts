/**
 * External dependencies
 */
import {
	MONTHS_IN_YEAR,
	monthOrder,
	type MonthKey,
	type MonthlyHeatmapMetric,
	type MonthlyHeatmapRow,
} from '@jetpack-premium-analytics/widgets-toolkit';

/** One `stats/visits` month bucket: its first day and its views. */
export type MonthBucket = { date: string; views: number };

/** The bucket's month, from a `yyyy-MM` or `yyyy-MM-dd` label. */
function readMonthKey( date: string ): MonthKey | null {
	const match = /^(\d{4})-(\d{2})/.exec( date );

	if ( ! match ) {
		return null;
	}

	const month = Number( match[ 2 ] ) - 1;

	return month >= 0 && month < MONTHS_IN_YEAR ? { year: Number( match[ 1 ] ), month } : null;
}

/** Days in the month, counting the current one only up to today. */
function daysCovered( key: MonthKey, today: MonthKey & { day: number } ): number {
	if ( key.year === today.year && key.month === today.month ) {
		return today.day;
	}

	return new Date( key.year, key.month + 1, 0 ).getDate();
}

/**
 * Turns the monthly buckets into one row per year, newest first, from the
 * first month with views through the current one. Views per day divides a
 * month's views by its days as Calypso's `getSiteStatsViewSummary()` does; the
 * year's roll-up divides the year's views by the days it covers.
 *
 * @param buckets - The `stats/visits` month buckets, in any order.
 * @param metric  - Which number each cell reports.
 * @param today   - The site's current day, which closes the last row.
 * @return One row per year with views, newest first. Empty without any views.
 */
export function buildViewsOverYearsRows(
	buckets: MonthBucket[],
	metric: MonthlyHeatmapMetric,
	today: MonthKey & { day: number }
): MonthlyHeatmapRow[] {
	const viewsByOrder = new Map< number, number >();

	for ( const bucket of buckets ) {
		const key = readMonthKey( bucket.date );

		if ( key ) {
			const order = monthOrder( key );

			viewsByOrder.set( order, ( viewsByOrder.get( order ) ?? 0 ) + bucket.views );
		}
	}

	// The endpoint pads zero months back to the requested start, which says
	// nothing about the site, so the table opens on the first month with views.
	const withViews = [ ...viewsByOrder.entries() ].filter( ( [ , views ] ) => views > 0 );

	if ( withViews.length === 0 ) {
		return [];
	}

	const firstOrder = Math.min( ...withViews.map( ( [ order ] ) => order ) );
	const lastOrder = Math.max( monthOrder( today ), ...withViews.map( ( [ order ] ) => order ) );
	const firstYear = Math.floor( firstOrder / MONTHS_IN_YEAR );
	const lastYear = Math.floor( lastOrder / MONTHS_IN_YEAR );
	const rows: MonthlyHeatmapRow[] = [];

	for ( let year = lastYear; year >= firstYear; year-- ) {
		let yearViews = 0;
		let yearDays = 0;

		const months = Array.from( { length: MONTHS_IN_YEAR }, ( _month, month ) => {
			const key = { year, month };
			const order = monthOrder( key );

			if ( order < firstOrder || order > lastOrder ) {
				return null;
			}

			const views = viewsByOrder.get( order ) ?? 0;
			const days = daysCovered( key, today );

			yearViews += views;
			yearDays += days;

			return metric === 'average' ? Math.round( views / days ) : views;
		} );

		rows.push( {
			year,
			months,
			total: metric === 'average' ? Math.round( yearViews / yearDays ) : yearViews,
		} );
	}

	return rows;
}
