/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { addDays, format, parseISO, subDays } from 'date-fns';
import type { DataPointDate } from '@jetpack-premium-analytics/externals';

export type CalendarHeatmapWindow = {
	/** Inclusive first day to fetch, `yyyy-MM-dd`. */
	startDate: string;
	/** Inclusive last day to fetch, `yyyy-MM-dd`. */
	endDate: string;
};

export type CalendarHeatmapWindowBounds = {
	/** Fewest inclusive dates; a shorter range is extended backwards. */
	minDays?: number;
	/** Most inclusive dates; a longer range keeps only the most recent. */
	maxDays?: number;
};

/**
 * Resolves the day window a calendar heatmap should fetch from the report range.
 *
 * Bounds count **inclusive dates** — `n` means `end - (n - 1)`, so 366 covers a
 * whole leap year. A cap of 365 would drop 1 January from a selected leap year
 * while the filter still says the year.
 *
 * `maxDays` clamps against the range start rather than replacing it, so capping
 * a partial current year cannot reach back into the year before it. `todayIso`
 * is only the fallback end date, and keeps this testable without a clock.
 */
export function resolveCalendarHeatmapWindow(
	params: { from?: string; to?: string },
	bounds: CalendarHeatmapWindowBounds,
	todayIso: string
): CalendarHeatmapWindow {
	const { minDays, maxDays } = bounds;
	const endDate = getDatePart( params.to ) ?? todayIso;
	const end = parseISO( endDate );

	// `yyyy-MM-dd` strings compare chronologically, so the bounds are applied as
	// plain string comparisons against the range start.
	let startDate = getDatePart( params.from ) ?? endDate;

	if ( minDays !== undefined ) {
		const floor = format( subDays( end, minDays - 1 ), 'yyyy-MM-dd' );
		if ( startDate > floor ) {
			startDate = floor;
		}
	}

	if ( maxDays !== undefined ) {
		const cap = format( subDays( end, maxDays - 1 ), 'yyyy-MM-dd' );
		if ( startDate < cap ) {
			startDate = cap;
		}
	}

	// An inverted range (a `from` past the range end, with no bound to correct
	// it) would otherwise produce a window no day can fall in.
	return { startDate: startDate > endDate ? endDate : startDate, endDate };
}

/**
 * Fills a window with one point per calendar day from a `yyyy-MM-dd` lookup,
 * leaving days it has no entry for as `null`.
 *
 * Payloads carry only the days they have something to say about, so undensified
 * `buildCalendarHeatmapData` would lay out just the weeks between them. Whether
 * a real `0` reads as an empty cell differs by metric, so map it to `null` in
 * the lookup rather than here.
 *
 * Falls back to the lookup's own entries when the window is missing or inverted.
 */
export function buildDenseDaySeries(
	valueByDay: Record< string, number | null > | Map< string, number | null >,
	from?: string,
	to?: string
): DataPointDate[] {
	const lookup = valueByDay instanceof Map ? valueByDay : new Map( Object.entries( valueByDay ) );
	const fromPart = getDatePart( from );
	const toPart = getDatePart( to );

	if ( ! fromPart || ! toPart || fromPart > toPart ) {
		return [ ...lookup ].map( ( [ dateString, value ] ) => ( { dateString, value } ) );
	}

	const series: DataPointDate[] = [];
	// Walk in UTC so the day-by-day iteration is DST-agnostic; the keys are plain
	// calendar dates.
	const end = new Date( `${ toPart }T00:00:00Z` );

	for ( let day = new Date( `${ fromPart }T00:00:00Z` ); day <= end; day = addDays( day, 1 ) ) {
		const dateString = day.toISOString().slice( 0, 10 );
		series.push( { dateString, value: lookup.get( dateString ) ?? null } );
	}

	return series;
}
