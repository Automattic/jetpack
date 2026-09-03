/**
 * Internal dependencies
 */
import { reportingTimeZone } from './reporting-time-zone';
import { readSiteTimestamp } from './site-timestamp';
import { toLocalTZ } from './tz';

/**
 * Parse a timestamp in the timezone reports are read in.
 *
 * Offset-less Stats API values are anchored to that zone; offset-bearing ones
 * already name an instant and keep it.
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

	const parsed = toLocalTZ( timestamp.value, reportingTimeZone() );

	// A plain `Date`, so callers keep reading its parts in their own zone as they did.
	return isNaN( parsed.getTime() ) ? undefined : new Date( parsed.getTime() );
}
