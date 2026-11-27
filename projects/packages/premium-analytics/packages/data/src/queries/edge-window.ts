/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import type { ReportParams } from '../utils/search';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days the pre-aggregated edge table serves at once; a longer window gets a 400 no retry fixes. */
export const EDGE_ROLLUP_MAX_DAYS = 366;

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
		? new Date( lastDay + MS_PER_DAY ).toISOString().slice( 0, 10 )
		: undefined;

	return { start, end };
}

/**
 * Whether a window is longer than the pre-aggregated table serves, so no request is worth sending.
 *
 * @param params - The report window.
 * @return True when the endpoint would refuse the range.
 */
export function isEdgeWindowTooLong( params: Pick< ReportParams, 'from' | 'to' > ): boolean {
	const { start, end } = edgeWindow( params );
	return (
		!! start &&
		!! end &&
		( Date.parse( end ) - Date.parse( start ) ) / MS_PER_DAY > EDGE_ROLLUP_MAX_DAYS
	);
}

/** A report window, plus the page the edge templates count when it is scoped to one post. */
export type EdgeScopeParams = ReportParams & {
	/** The page's path, as the edge logs it: no scheme or host. */
	url?: string;
};

/**
 * The path the edge logs a page's requests under, from the page's permalink.
 *
 * @param permalink - The page's public URL.
 * @return The path and query string, or undefined when the permalink cannot be read.
 */
export function toEdgePath( permalink: string | undefined ): string | undefined {
	if ( ! permalink ) {
		return undefined;
	}

	try {
		const { pathname, search } = new URL( permalink );
		return pathname + search;
	} catch {
		return undefined;
	}
}
