/**
 * External dependencies
 */
import { dateToISOStringWithTZ, toLocalTZ } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { FIXTURE_SITE_TIME_ZONE } from './wp-date-settings';

/**
 * A `Date` names a wall time here: the report generators build days with `Date.UTC`.
 *
 * @param value - Wall time, as a string or a UTC-built `Date`.
 * @return The wall time as a naive ISO string.
 */
function wallTimeOf( value: string | Date ): string {
	return value instanceof Date ? value.toISOString().slice( 0, 19 ) : value;
}

/**
 * A Woo interval bound the way wpcom stamps it: ISO 8601 in the site's own zone.
 *
 * Deriving the offset from the zone is the point — a hardcoded one describes a
 * payload the server cannot send, and would fail for the wrong reason.
 *
 * @param wallTime - Wall time in the site's zone, e.g. `2024-01-01` or `2024-01-01T23:59:59`.
 * @param timeZone - The site's timezone.
 * @return The stamp, e.g. `2024-01-01T00:00:00+09:00`.
 */
export function wooBucketStamp(
	wallTime: string | Date,
	timeZone: string = FIXTURE_SITE_TIME_ZONE
): string {
	// PHP's `format( 'c' )` carries no milliseconds.
	const stamp = dateToISOStringWithTZ( toLocalTZ( wallTimeOf( wallTime ), timeZone ), timeZone );

	return stamp.replace( /\.\d{3}(?=[+-]\d{2}:\d{2}$)/, '' );
}
