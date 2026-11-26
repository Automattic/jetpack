/**
 * External dependencies
 */
import { parseISO } from 'date-fns';
import type { DayRange } from '@jetpack-premium-analytics/datetime';

/**
 * Extract a calendar-valid `YYYY-MM-DD` day from an ISO report param. Params
 * originate from URL search params, so a hand-edited deep link can carry a
 * well-shaped but non-existent day like `2026-02-31`; `parseISO` rejects those
 * before they reach date maths that would throw on them.
 *
 * @param value - The ISO date-time string.
 * @return The date-only day, or undefined when missing, malformed, or impossible.
 */
export function toDay( value?: string ): string | undefined {
	const day = value?.slice( 0, 10 );

	return day && /^\d{4}-\d{2}-\d{2}$/.test( day ) && ! Number.isNaN( parseISO( day ).getTime() )
		? day
		: undefined;
}

/**
 * The day range of a pair of ISO report params.
 *
 * @param from - The range's first instant.
 * @param to   - The range's last instant.
 * @return Both days, or undefined when either is missing or invalid.
 */
export function toDayRange( from?: string, to?: string ): DayRange | undefined {
	const first = toDay( from );
	const last = toDay( to );

	return first && last ? { from: first, to: last } : undefined;
}
