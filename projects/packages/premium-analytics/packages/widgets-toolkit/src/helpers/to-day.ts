/**
 * External dependencies
 */
import { parseISO } from 'date-fns';

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
