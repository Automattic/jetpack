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

/** One `stats/visits` month bucket: the month and its views. */
export type MonthBucket = { month: MonthKey; views: number };

/** A calendar day on the site's own calendar, as `MonthKey` counts it. */
export type DayKey = MonthKey & { day: number };

const isSameMonth = ( key: MonthKey, other: MonthKey ) =>
	key.year === other.year && key.month === other.month;

const toMonthKey = ( date: Date ): MonthKey => ( {
	year: date.getFullYear(),
	month: date.getMonth(),
} );

/** The earliest month with views, which opens the table. */
export function firstMonthWithViews( buckets: MonthBucket[] ): MonthKey | undefined {
	return buckets
		.filter( ( { views } ) => views > 0 )
		.reduce< MonthKey | undefined >(
			( first, { month } ) =>
				first && monthOrder( first ) <= monthOrder( month ) ? first : month,
			undefined
		);
}

/** Days in the month, from the first day and up to today when either falls inside. */
function daysCovered( key: MonthKey, today: Date, firstDay?: DayKey ): number {
	const first = firstDay && isSameMonth( key, firstDay ) ? firstDay.day : 1;
	const last = isSameMonth( key, toMonthKey( today ) )
		? today.getDate()
		: new Date( key.year, key.month + 1, 0 ).getDate();

	// A browser clock behind the server can put the first day after today.
	return Math.max( last - first + 1, 1 );
}

/**
 * Turns the monthly buckets into one row per year, newest first, from the
 * first month with views through the current one; the year's roll-up divides
 * the year's views by the days it covers, not the mean of its months.
 *
 * @param buckets - The `stats/visits` month buckets, in any order.
 * @param metric  - Which number each cell reports.
 * @param today   - The site's current day, which closes the last row.
 * @param opensAt - The site's first day with views, which opens the first month when it falls inside it.
 * @return One row per year with views, newest first. Empty without any views.
 */
export function buildViewsOverYearsRows(
	buckets: MonthBucket[],
	metric: MonthlyHeatmapMetric,
	today: Date,
	opensAt?: DayKey
): MonthlyHeatmapRow[] {
	// The endpoint pads zero months back to the requested start, which says
	// nothing about the site, so the table opens on the first month with views.
	const firstMonth = firstMonthWithViews( buckets );

	if ( ! firstMonth ) {
		return [];
	}

	const viewsByOrder = new Map< number, number >();

	for ( const { month, views } of buckets ) {
		const order = monthOrder( month );

		viewsByOrder.set( order, ( viewsByOrder.get( order ) ?? 0 ) + views );
	}

	const withViews = buckets.filter( ( { views } ) => views > 0 ).map( b => monthOrder( b.month ) );
	const firstOrder = monthOrder( firstMonth );
	const lastOrder = Math.max( monthOrder( toMonthKey( today ) ), ...withViews );
	const firstYear = Math.floor( firstOrder / MONTHS_IN_YEAR );
	const lastYear = Math.floor( lastOrder / MONTHS_IN_YEAR );
	// A first day outside the first month with views leaves that month whole, as
	// `monthlyHeatmapLifeStart` does for the Traffic range.
	const firstDay = opensAt && isSameMonth( firstMonth, opensAt ) ? opensAt : undefined;
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
			const days = daysCovered( key, today, firstDay );

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
