/**
 * External dependencies
 */
import { getDate } from '@wordpress/date';

/** Date-only, MySQL datetime, or ISO datetime values used by Stats and report params. */
const SITE_DATE_TIME =
	/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Parse a timestamp in the WordPress site timezone.
 *
 * `getDate` anchors offset-less Stats API values to the timezone configured in
 * WordPress while preserving the instant identified by offset-bearing values.
 *
 * @param value - The raw timestamp, or a `Date`.
 * @return The instant, or `undefined` when the value is missing or malformed.
 */
export function parseSiteDateTime( value: unknown ): Date | undefined {
	if ( value instanceof Date ) {
		return isNaN( value.getTime() ) ? undefined : value;
	}

	if ( typeof value !== 'string' ) {
		return undefined;
	}

	const raw = value.trim();

	if ( ! SITE_DATE_TIME.test( raw ) ) {
		return undefined;
	}

	const parsed = getDate( raw );

	return isNaN( parsed.getTime() ) ? undefined : parsed;
}
