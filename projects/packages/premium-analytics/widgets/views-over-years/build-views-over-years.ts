/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import type { StatsVisitsResponse } from '@jetpack-premium-analytics/data';

export const MONTHS_IN_YEAR = 12;

/** Which number each cell reports: the month's views, or its views per day. */
export type ViewsOverYearsMetric = 'total' | 'average';

export type ViewsOverYearsRow = {
	year: number;
	/**
	 * One entry per calendar month, January first. `null` for a month outside
	 * the span the site has views for — before its first month with traffic, or
	 * still in the future.
	 */
	months: ( number | null )[];
	/** The year's own figure under the same metric. */
	total: number;
};

type MonthKey = { year: number; month: number };

/**
 * Days the site was live in a month, which is the denominator "average per day"
 * divides by. The current month counts only the days that have happened, so a
 * month two days old is not averaged over thirty-one.
 *
 * @param year  - Calendar year.
 * @param month - Zero-based month.
 * @param today - The site's current day.
 * @return Number of days to average over.
 */
function daysInMonth( year: number, month: number, today: MonthKey & { day: number } ): number {
	if ( year === today.year && month === today.month ) {
		return today.day;
	}

	// Day 0 of the next month is the last day of this one.
	return new Date( Date.UTC( year, month + 1, 0 ) ).getUTCDate();
}

/**
 * Reads a monthly `stats/visits` bucket's calendar month. Buckets carry
 * `date_start` as a timezone-naive month start; `time_interval` repeats it and
 * covers a response that supplied its own bounds.
 */
function readMonth( row: { date_start?: string; time_interval?: string } ): MonthKey | null {
	const datePart = getDatePart( row.date_start ) ?? getDatePart( row.time_interval );
	const match = datePart?.match( /^(\d{4})-(\d{2})/ );

	if ( ! match ) {
		return null;
	}

	return { year: Number( match[ 1 ] ), month: Number( match[ 2 ] ) - 1 };
}

const monthOrder = ( { year, month }: MonthKey ) => year * MONTHS_IN_YEAR + month;

/**
 * Turns monthly view buckets into one row per year, newest first.
 *
 * The request reaches back to a fixed floor rather than to the site's own first
 * day, which nothing on the client knows, so the response opens with however
 * many empty months predate the site. The first month with views is therefore
 * where the table starts: everything before it is left blank rather than shown
 * as a wall of zeros, and a measured zero inside the span is still drawn as a
 * zero.
 *
 * @param report - The sanitized `stats/visits` response, at `unit=month`.
 * @param metric - Which number each cell reports.
 * @param today  - The site's current day, which bounds the last row and caps
 *               the current month's average.
 * @return One row per covered year, newest first. Empty when the site has no views.
 */
export function buildViewsOverYears(
	report: StatsVisitsResponse | undefined,
	metric: ViewsOverYearsMetric,
	today: Date
): ViewsOverYearsRow[] {
	const viewsByMonth = new Map< number, number >();
	let firstWithViews: MonthKey | undefined;

	( report?.data ?? [] ).forEach( row => {
		const key = readMonth( row );
		const views = Number( row.views ?? 0 );

		if ( ! key || ! Number.isFinite( views ) ) {
			return;
		}

		viewsByMonth.set( monthOrder( key ), views );

		if ( views > 0 && ( ! firstWithViews || monthOrder( key ) < monthOrder( firstWithViews ) ) ) {
			firstWithViews = key;
		}
	} );

	if ( ! firstWithViews ) {
		return [];
	}

	const todayParts = {
		year: today.getFullYear(),
		month: today.getMonth(),
		day: today.getDate(),
	};
	// The response ends at today, but a stale one can end earlier; the table
	// still reads to today so the current year is never silently dropped.
	const lastCovered = Math.max( monthOrder( todayParts ), ...viewsByMonth.keys() );
	const firstCovered = monthOrder( firstWithViews );
	const lastYear = Math.floor( lastCovered / MONTHS_IN_YEAR );

	const rows: ViewsOverYearsRow[] = [];

	for ( let year = lastYear; year >= firstWithViews.year; year-- ) {
		let yearViews = 0;
		let yearDays = 0;

		const months = Array.from( { length: MONTHS_IN_YEAR }, ( _month, month ) => {
			const order = monthOrder( { year, month } );

			if ( order < firstCovered || order > lastCovered ) {
				return null;
			}

			const views = viewsByMonth.get( order ) ?? 0;
			const days = daysInMonth( year, month, todayParts );

			yearViews += views;
			yearDays += days;

			return metric === 'average' ? Math.round( views / days ) : views;
		} );

		rows.push( {
			year,
			months,
			// Averaged over the year's own days rather than over its monthly
			// averages, so a part-year reports what it actually drew per day.
			total: metric === 'average' ? Math.round( yearViews / yearDays ) : yearViews,
		} );
	}

	return rows;
}
