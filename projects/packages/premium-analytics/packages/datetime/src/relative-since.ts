/**
 * External dependencies
 */
import { formatDistanceStrict, isValid, parseISO } from 'date-fns';

/**
 * Formats an ISO timestamp as a compact relative "since" label using date-fns'
 * `formatDistanceStrict` (e.g. "12 minutes ago", "5 hours ago", "1 day ago",
 * "2 months ago"). The strict variant drops the looser "about"/"less than a
 * minute" qualifiers for a shorter label; locale and pluralization are handled
 * by date-fns, so callers never hand-roll `Date` arithmetic or wording.
 *
 * @param iso - ISO timestamp, or undefined.
 * @param now - Reference "now" (defaults to the current time); injectable for tests.
 * @return The relative-time label, or an empty string when there is no valid date.
 */
export function formatRelativeSince( iso?: string, now: Date = new Date() ): string {
	if ( ! iso ) {
		return '';
	}

	const then = parseISO( iso );
	if ( ! isValid( then ) ) {
		return '';
	}

	return formatDistanceStrict( then, now, { addSuffix: true } );
}
