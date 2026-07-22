/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { format, parseISO, subDays } from 'date-fns';

export type StreakRange = {
	/** Inclusive first day to fetch, `yyyy-MM-dd`. */
	startDate: string;
	/** Inclusive last day to fetch, `yyyy-MM-dd`. */
	endDate: string;
};

/**
 * Floors the streak fetch window to at least `minDays` ending on the report's end
 * date, so the calendar heatmap always has a full span of week columns to lay out
 * — even when the dashboard date picker is on a short range (a 7-day range would
 * otherwise yield a single week column). A longer picker range is kept as-is.
 *
 * Pure and date-injectable so it can be unit-tested without a clock: `todayIso`
 * is only the fallback end date when the report has no `to`.
 *
 * @param params      - The report params (`yyyy-MM-dd` or ISO dates).
 * @param params.from - Picker start date, when present.
 * @param params.to   - Picker end date, when present.
 * @param minDays     - Minimum number of days the window must span.
 * @param todayIso    - Fallback end date (`yyyy-MM-dd`) when `params.to` is absent.
 * @return The floored `{ startDate, endDate }` window.
 */
export function resolveStreakRange(
	params: { from?: string; to?: string },
	minDays: number,
	todayIso: string
): StreakRange {
	const endDate = getDatePart( params.to ) ?? todayIso;
	// Earliest start the window may have and still cover `minDays`.
	const minStart = format( subDays( parseISO( endDate ), minDays ), 'yyyy-MM-dd' );
	const from = getDatePart( params.from );
	// Keep the picker's start only when it already reaches further back than the
	// floor; `yyyy-MM-dd` strings compare chronologically.
	const startDate = from && from < minStart ? from : minStart;

	return { startDate, endDate };
}
