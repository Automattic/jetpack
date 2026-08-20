/**
 * External dependencies
 */
import { getDate } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { readSiteTimestamp } from './site-timestamp';

/**
 * Parse a timestamp in the WordPress site timezone.
 *
 * `getDate` anchors offset-less Stats API values to the timezone configured in
 * WordPress while preserving the instant identified by offset-bearing values.
 * It shares `toLocalTZ`'s reading of which values are timestamps and which of
 * those are valid, so the two cannot disagree.
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

	const timestamp = readSiteTimestamp( value );

	if ( ! timestamp?.isValid ) {
		return undefined;
	}

	const parsed = getDate( timestamp.value );

	return isNaN( parsed.getTime() ) ? undefined : parsed;
}
