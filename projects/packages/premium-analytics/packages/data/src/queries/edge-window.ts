/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import type { ReportParams } from '../utils/search';

/**
 * A report window as the edge templates of `stats/ua-queries` take it: whole
 * days, with an exclusive `end`.
 *
 * @param params - The report window.
 * @return The bounds, each undefined when the window has no readable day.
 */
export function edgeWindow( params: Pick< ReportParams, 'from' | 'to' > ) {
	const start = getDatePart( params.from ) || undefined;
	const lastDay = Date.parse( `${ getDatePart( params.to ) }T00:00:00Z` );
	const end = Number.isFinite( lastDay )
		? new Date( lastDay + 24 * 60 * 60 * 1000 ).toISOString().slice( 0, 10 )
		: undefined;

	return { start, end };
}
