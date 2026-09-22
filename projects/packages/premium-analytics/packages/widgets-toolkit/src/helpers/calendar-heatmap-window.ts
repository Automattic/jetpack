/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { format, parseISO, subDays } from 'date-fns';
/**
 * Internal dependencies
 */
import type { DataPointDate } from '@jetpack-premium-analytics/externals';

export type CalendarHeatmapWindow = {
	startDate: string;
	endDate: string;
};

/**
 * Date a heatmap grid opens on to draw `columns` columns ending `endDate`. A
 * short period is padded backwards with unrequested filler (WOOA7S-1963), so
 * trimming later drops the oldest — filler — columns first.
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
