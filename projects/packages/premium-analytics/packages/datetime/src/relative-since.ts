/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	differenceInCalendarDays,
	differenceInHours,
	differenceInMinutes,
	format,
	isValid,
	parseISO,
} from 'date-fns';

/**
 * Formats an ISO timestamp as a compact relative "since" label — "Just now",
 * "%dm ago", "%dh ago", "Yesterday", "%dd ago" — falling back to a short date
 * (via date-fns) for anything older than a week.
 *
 * Uses date-fns for all date math (parsing, diffing, formatting) so callers
 * never hand-roll `Date` arithmetic. The timezone of the instant is taken from
 * the ISO string itself; calendar-day boundaries ("Yesterday") are evaluated in
 * the local timezone.
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

	const minutes = differenceInMinutes( now, then );
	if ( minutes < 1 ) {
		return __( 'Just now', 'jetpack-premium-analytics' );
	}
	if ( minutes < 60 ) {
		// translators: %d is a number of minutes.
		return sprintf( __( '%dm ago', 'jetpack-premium-analytics' ), minutes );
	}

	const hours = differenceInHours( now, then );
	if ( hours < 24 ) {
		// translators: %d is a number of hours.
		return sprintf( __( '%dh ago', 'jetpack-premium-analytics' ), hours );
	}

	const days = differenceInCalendarDays( now, then );
	if ( days === 1 ) {
		return __( 'Yesterday', 'jetpack-premium-analytics' );
	}
	if ( days < 7 ) {
		// translators: %d is a number of days.
		return sprintf( __( '%dd ago', 'jetpack-premium-analytics' ), days );
	}

	return format( then, 'PP' );
}
