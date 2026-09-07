/**
 * External dependencies
 */
import { format, isValid } from 'date-fns';
/**
 * Internal dependencies
 */
import { toLocalTZ } from './tz';

const BUCKET_STAMP_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

/**
 * Normalize a bucket bound into the one shape a report carries: a naive wall time.
 *
 * Woo stamps its bounds with the site's own offset, so it is resolved and dropped
 * here rather than left for each reader to decide about. An unrecognized value is
 * returned as written, so an empty default bound stays empty.
 *
 * @param raw  - The bound as the API wrote it.
 * @param zone - The report's reporting timezone.
 * @return The bound as a timezone-naive wall time.
 */
export function toBucketStamp( raw: string, zone: string ): string {
	// `toLocalTZ` reads a missing value as the current instant, which would stamp
	// a malformed row with today rather than leaving it alone.
	if ( typeof raw !== 'string' ) {
		return raw;
	}

	const date = toLocalTZ( raw, zone );

	return isValid( date ) ? format( date, BUCKET_STAMP_FORMAT ) : raw;
}
