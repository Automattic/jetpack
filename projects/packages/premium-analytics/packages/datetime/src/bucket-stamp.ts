/**
 * External dependencies
 */
import { format, isValid } from 'date-fns';
/**
 * Internal dependencies
 */
import { formatDatePartWithTime } from './date';
import { readSiteTimestamp } from './site-timestamp';
import { createTZDateFromParts, toLocalTZ } from './tz';
import type { TZDate } from '@date-fns/tz';

/**
 * Normalize a bucket bound into the one shape a report carries: a naive wall time.
 *
 * A stated offset is resolved and dropped, where `resolveBucketStamp` ignores one.
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

/**
 * Read a bucket stamp as the instant it names in the report's timezone.
 *
 * Any offset a stamp still carries is ignored: the stamp labels a calendar
 * bucket, so honouring one would move the bucket off its own midnight.
 *
 * @param stamp - The bound, as `toBucketStamp` wrote it.
 * @param zone  - The report's reporting timezone.
 * @return The instant, or `undefined` when the bound is missing or malformed.
 */
export function resolveBucketStamp( stamp: string | undefined, zone: string ): TZDate | undefined {
	if ( ! stamp ) {
		return undefined;
	}

	const timestamp = readSiteTimestamp( stamp );

	if ( ! timestamp?.isValid ) {
		return undefined;
	}

	const date = createTZDateFromParts( timestamp.parts, zone );

	return isNaN( date.getTime() ) ? undefined : date;
}
