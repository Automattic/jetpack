/**
 * Internal dependencies
 */
import { reportingTimeZone } from './reporting-time-zone';
import { readSiteTimestamp } from './site-timestamp';
import { createTZDateFromParts } from './tz';

/**
 * Read a Stats bucket's stamp as the instant it names in the site's timezone.
 *
 * Any stated offset is ignored: a bucket stamp names a site-local calendar
 * bucket, so honouring an offset would move it off its own midnight.
 *
 * @param value - The bucket's `date_start`.
 * @return The instant, or `undefined` when the value is missing or malformed.
 */
export function parseBucketStart( value: unknown ): Date | undefined {
	if ( typeof value !== 'string' ) {
		return undefined;
	}

	const timestamp = readSiteTimestamp( value );

	if ( ! timestamp?.isValid ) {
		return undefined;
	}

	const date = createTZDateFromParts( timestamp.parts, reportingTimeZone() );

	return isNaN( date.getTime() ) ? undefined : date;
}
