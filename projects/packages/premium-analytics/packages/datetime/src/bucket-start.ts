/**
 * Internal dependencies
 */
import { siteTimeZone } from './site-time-zone';
import { readSiteTimestamp } from './site-timestamp';
import { createTZDateFromParts } from './tz';

/**
 * Read a Stats bucket's stamp as the instant it names in the site's timezone.
 *
 * Any stated offset is ignored: the time-series passthrough copies `date_start`
 * from the API verbatim, so a bucket can carry a nominal offset that would shift it.
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

	const date = createTZDateFromParts( timestamp.parts, siteTimeZone() );

	return isNaN( date.getTime() ) ? undefined : date;
}
