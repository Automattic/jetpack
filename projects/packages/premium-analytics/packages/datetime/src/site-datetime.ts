/**
 * Internal dependencies
 */
import { reportingTimeZone } from './reporting-time-zone';
import { readSiteTimestamp } from './site-timestamp';
import { toLocalTZ } from './tz';
import type { TZDate } from '@date-fns/tz';

/**
 * Parse a timestamp in the timezone reports are read in.
 *
 * Offset-less Stats API values are anchored to that zone; offset-bearing ones
 * already name an instant and keep it.
 *
 * Anchored to that zone rather than left plain, so date arithmetic on the result
 * takes its day boundaries there instead of in the browser's zone.
 *
 * @param value - The raw timestamp, or a `Date`.
 * @return The instant, or `undefined` when the value is missing or malformed.
 */
export function parseSiteDateTime( value: unknown ): TZDate | undefined {
	if ( value instanceof Date ) {
		// Re-anchored, not returned as-is: the same instant, read in the reporting
		// zone whatever zone the caller's `Date` carried.
		return isNaN( value.getTime() ) ? undefined : toLocalTZ( value.getTime(), reportingTimeZone() );
	}

	if ( typeof value !== 'string' ) {
		return undefined;
	}

	const timestamp = readSiteTimestamp( value );

	if ( ! timestamp?.isValid ) {
		return undefined;
	}

	const parsed = toLocalTZ( timestamp.value, reportingTimeZone() );

	return isNaN( parsed.getTime() ) ? undefined : parsed;
}
