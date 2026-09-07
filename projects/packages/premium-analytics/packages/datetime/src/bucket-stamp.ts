/**
 * External dependencies
 */
import { format, isValid } from 'date-fns';
/**
 * Internal dependencies
 */
import { formatDatePartWithTime } from './date';
import { toLocalTZ } from './tz';

/**
 * Normalize a bucket bound into the one shape a report carries: a naive wall time.
 *
 * A stated offset is resolved and dropped, where `parseBucketStart` ignores one.
 * Woo stamps the site's own offset, so no endpoint writes a bound this shifts today.
 *
 * @param raw  - The bound as the API wrote it.
 * @param zone - The report's reporting timezone.
 * @return The bound as a naive wall time; an unrecognized string as written.
 */
export function toBucketStamp( raw: string | undefined, zone: string ): string {
	// `toLocalTZ` reads a missing value as the current instant, which would stamp
	// a malformed row with today.
	if ( typeof raw !== 'string' ) {
		return '';
	}

	const date = toLocalTZ( raw, zone );

	return isValid( date )
		? formatDatePartWithTime( format( date, 'yyyy-MM-dd' ), format( date, 'HH:mm:ss' ) )
		: raw;
}
