/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { format, parseISO, subDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { compactCalendarHeatmapCapacity } from './calendar-heatmap-layout';
import type { DataPointDate } from '@jetpack-premium-analytics/externals';

export type CalendarHeatmapWindow = {
	startDate: string;
	endDate: string;
};

export type CalendarHeatmapWindowBounds = {
	maxDays?: number;
};

/**
 * Caps a report range at an inclusive maximum day count.
 *
 * A floor is deliberately not offered: it would reach back past the selection,
 * and the card would attribute years the user did not choose to the year in its
 * heading (WOOA7S-1963). A range too short to fill the tile is filled with
 * filler weeks instead — see `resolveCalendarHeatmapGridStart`.
 */
export function resolveCalendarHeatmapWindow(
	params: { from?: string; to?: string },
	bounds: CalendarHeatmapWindowBounds,
	todayIso: string
): CalendarHeatmapWindow {
	const { maxDays } = bounds;
	const endDate = getDatePart( params.to ) ?? todayIso;
	const end = parseISO( endDate );

	// ISO date-only strings sort chronologically.
	let startDate = getDatePart( params.from ) ?? endDate;

	if ( maxDays !== undefined ) {
		// Bounds count inclusive dates, hence the subtraction of one day.
		const cap = format( subDays( end, maxDays - 1 ), 'yyyy-MM-dd' );
		if ( startDate < cap ) {
			startDate = cap;
		}
	}

	return { startDate: startDate > endDate ? endDate : startDate, endDate };
}

/**
 * The date a heatmap grid has to open on to draw `columns` week columns ending
 * with `endDate`.
 *
 * A period shorter than the tile leaves the grid part-filled, so the grid is
 * opened back far enough to fill it. Those earlier weeks are drawn, not
 * requested: the chart paints them as filler that reports nothing, and the
 * fetch window stays inside the period the user selected (WOOA7S-1963).
 *
 * Opening backwards rather than running on past `endDate` also keeps trimming
 * honest — the grid drops its oldest columns first, which are the filler.
 *
 * @param endDate - Last day the grid covers, `yyyy-MM-dd`.
 * @param columns - Week columns the tile can draw.
 * @return The grid's first day, or `undefined` when the inputs can't size one.
 */
export function resolveCalendarHeatmapGridStart(
	endDate: string,
	columns: number
): string | undefined {
	if ( ! Number.isFinite( columns ) || columns < 1 ) {
		return undefined;
	}

	const end = parseISO( endDate );
	if ( isNaN( end.getTime() ) ) {
		return undefined;
	}

	// A whole number of weeks back from `endDate` lands on the same weekday, so
	// the grid spans exactly `columns` columns whichever day the week starts on.
	return format( subDays( end, ( Math.floor( columns ) - 1 ) * 7 ), 'yyyy-MM-dd' );
}

/**
 * Fills missing dates in a window with null-valued points.
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
	// Walk in UTC so daylight-saving transitions cannot skip or repeat a date.
	const end = new Date( `${ toPart }T00:00:00Z` );

	for (
		let day = new Date( `${ fromPart }T00:00:00Z` );
		day <= end;
		day.setUTCDate( day.getUTCDate() + 1 )
	) {
		const dateString = day.toISOString().slice( 0, 10 );
		series.push( { dateString, value: lookup.get( dateString ) ?? null } );
	}

	return series;
}

// A whole leap year, so a selected leap year never loses 1 January.
const WINDOW_YEAR_DAYS = 366;
// Six years fills a ~4100px-wide tile, past any display worth planning for; beyond
// it the request grows faster than the columns it buys.
const MAX_WINDOW_YEARS = 6;

/**
 * How many days of history a calendar heatmap is worth requesting at a given
 * viewport width.
 *
 * The grid only draws the week columns that fit, so history beyond what the widest
 * possible tile could show would be fetched and thrown away. Compact-cell capacity
 * is a stable proxy for that ceiling; adaptive cells can shrink further in unusually
 * short tiles. The result is quantized to whole years so resizing the window cannot
 * fire a fresh request per column gained.
 *
 * @param viewportWidth - Viewport width in px.
 * @return Days of history to request.
 */
export function resolveCalendarHeatmapWindowDays( viewportWidth: number ): number {
	const capacityDays = compactCalendarHeatmapCapacity( viewportWidth ) * 7;
	const years = Math.ceil( capacityDays / WINDOW_YEAR_DAYS );

	return Math.min( Math.max( years, 1 ), MAX_WINDOW_YEARS ) * WINDOW_YEAR_DAYS;
}
