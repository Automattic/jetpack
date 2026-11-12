/**
 * External dependencies
 */
import {
	MONTHS_IN_YEAR,
	daysCovered,
	isMonthIncomplete,
	monthOrder,
	toMonthKey,
	type DayKey,
	type MonthKey,
	type MonthlyHeatmapMetric,
	type MonthlyHeatmapRow,
	type MonthlyHeatmapTarget,
} from '@jetpack-premium-analytics/widgets-toolkit';

/** One `stats/visits` month bucket: the month and its views. */
export type MonthBucket = { month: MonthKey; views: number };

/**
 * Turns the monthly buckets into one row per year, newest first, from the
 * first month with views through the current one; the year's roll-up divides
 * the year's views by the days it covers, not the mean of its months.
 *
 * @param buckets - The `stats/visits` month buckets, in any order.
 * @param metric  - Which number each cell reports.
 * @param today   - The site's current day, which closes the last row.
 * @param opensAt - The site's first day with views, which opens the first month when it falls inside it.
 * @return One row per year with views, newest first, and the months the data does not fill, which a total cannot compare with a full month; without any views, the current month alone at zero.
 */
export function buildViewsOverYearsRows(
	buckets: MonthBucket[],
	metric: MonthlyHeatmapMetric,
	today: Date,
	opensAt?: DayKey
): { rows: MonthlyHeatmapRow[]; partialMonths: MonthlyHeatmapTarget[] } {
	const viewsByOrder = new Map< number, number >();

	for ( const { month, views } of buckets ) {
		const order = monthOrder( month );

		viewsByOrder.set( order, ( viewsByOrder.get( order ) ?? 0 ) + views );
	}

	// The endpoint pads zero months back to the requested start, which says
	// nothing about the site, so the table opens on the first month with views.
	const withViews = [ ...viewsByOrder.entries() ].filter( ( [ , views ] ) => views > 0 );
	const firstOrder = Math.min(
		monthOrder( toMonthKey( today ) ),
		...withViews.map( ( [ order ] ) => order )
	);
	const lastOrder = Math.max(
		monthOrder( toMonthKey( today ) ),
		...withViews.map( ( [ order ] ) => order )
	);
	const firstYear = Math.floor( firstOrder / MONTHS_IN_YEAR );
	const lastYear = Math.floor( lastOrder / MONTHS_IN_YEAR );
	// A first day outside the first month with views leaves that month whole, as
	// `monthlyHeatmapLifeStart` does for the Traffic range.
	const firstDay = opensAt && monthOrder( opensAt ) === firstOrder ? opensAt : undefined;
	const rows: MonthlyHeatmapRow[] = [];
	const partialMonths: MonthlyHeatmapTarget[] = [];

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
			const days = daysCovered( key, today, firstDay );

			yearViews += views;
			yearDays += days;

			if ( isMonthIncomplete( key, metric, today, firstDay ) ) {
				partialMonths.push( key );
			}

			return metric === 'average' ? Math.round( views / days ) : views;
		} );

		rows.push( {
			year,
			months,
			total: metric === 'average' ? Math.round( yearViews / yearDays ) : yearViews,
		} );
	}

	return { rows, partialMonths };
}
