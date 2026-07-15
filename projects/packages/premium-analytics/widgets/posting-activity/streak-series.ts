/**
 * External dependencies
 */
import type { DataPointDate } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Densifies the sparse `stats/streak` response into a per-day series across the
 * whole fetched window. The endpoint only returns days that have posts, so on its
 * own `buildCalendarHeatmapData` would only see those clustered dates and lay out
 * the weeks between them. Filling every day from `from` to `to` — missing days
 * become `null`, an empty cell distinct from a real `0` — makes the heatmap span
 * the full range of week columns regardless of where posts fall.
 *
 * Falls back to the raw entries when the range is missing or inverted.
 *
 * @param counts - Post counts keyed by `yyyy-MM-dd` (only days with posts).
 * @param from   - Inclusive first day (`yyyy-MM-dd` or ISO), when present.
 * @param to     - Inclusive last day (`yyyy-MM-dd` or ISO), when present.
 * @return One data point per day across the window.
 */
export function buildStreakSeries(
	counts: Record< string, number >,
	from?: string,
	to?: string
): DataPointDate[] {
	const fromPart = from?.split( 'T' )[ 0 ];
	const toPart = to?.split( 'T' )[ 0 ];

	if ( ! fromPart || ! toPart || fromPart > toPart ) {
		return Object.entries( counts ).map( ( [ dateString, value ] ) => ( {
			dateString,
			value,
		} ) );
	}

	const series: DataPointDate[] = [];
	// Iterate in UTC so the day-by-day walk is DST-agnostic; the keys are plain
	// calendar dates.
	const end = new Date( `${ toPart }T00:00:00Z` );

	for (
		let day = new Date( `${ fromPart }T00:00:00Z` );
		day <= end;
		day.setUTCDate( day.getUTCDate() + 1 )
	) {
		const dateString = day.toISOString().slice( 0, 10 );
		series.push( { dateString, value: counts[ dateString ] ?? null } );
	}

	return series;
}
