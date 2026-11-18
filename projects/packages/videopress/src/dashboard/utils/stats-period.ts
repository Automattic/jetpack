import type { StatsPeriod } from '../hooks/use-stats';

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

// The stats endpoint serves up to a year of days per request.
const MAX_DAYS = 365;

/**
 * The stats period a pair of report dates names, as the dashboard hands them to a widget.
 *
 * @param from - First day, as an ISO date or datetime.
 * @param to   - Last day, as an ISO date or datetime.
 * @return The period, or undefined when a date is missing or the two are out of order.
 */
export function toStatsPeriod( from: unknown, to: unknown ): StatsPeriod | undefined {
	if (
		typeof from !== 'string' ||
		typeof to !== 'string' ||
		! ISO_DATE.test( from ) ||
		! ISO_DATE.test( to )
	) {
		return undefined;
	}

	const lastDay = to.slice( 0, 10 );
	const span =
		Date.parse( `${ lastDay }T00:00:00Z` ) - Date.parse( `${ from.slice( 0, 10 ) }T00:00:00Z` );
	const days = Math.round( span / DAY_MS ) + 1;

	return days >= 1 ? { to: lastDay, days: Math.min( days, MAX_DAYS ) } : undefined;
}

/**
 * The report dates of the last `days` days, today included: what `toStatsPeriod` reads back.
 *
 * @param days - Days the range spans.
 * @return The first and last moment of the range, as the dashboard writes report dates.
 */
export function lastDaysReportDates( days: number ): { from: string; to: string } {
	const today = new Date().toISOString().slice( 0, 10 );
	const firstDay = new Date( Date.parse( `${ today }T00:00:00Z` ) - ( days - 1 ) * DAY_MS )
		.toISOString()
		.slice( 0, 10 );

	return { from: `${ firstDay }T00:00:00`, to: `${ today }T23:59:59` };
}
