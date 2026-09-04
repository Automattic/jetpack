/**
 * External dependencies
 */
import { type TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { siteTimeZone } from './site-time-zone';
import { dateToISOStringWithTZ, toLocalTZ } from './tz';

/**
 * The timezone Premium Analytics reports in.
 *
 * The single place that decision is made, so moving reports off the site's own
 * zone stays a one-line change instead of a hunt across every layer.
 *
 * @return An IANA zone name, or a `±HH:MM` offset.
 */
export function reportingTimeZone(): string {
	return siteTimeZone();
}

/**
 * `toLocalTZ` with the reporting timezone as its default.
 *
 * @param value    - The value to anchor.
 * @param timezone - The zone to read it in, the reporting timezone when omitted.
 * @return The zoned date.
 */
export function localTZDate( value?: number | string | Date, timezone?: string ): TZDate {
	return toLocalTZ( value, timezone ?? reportingTimeZone() );
}

/**
 * TZ-aware Date -> ISO with the reporting offset `YYYY-MM-DDTHH:mm:ss.SSSxxx`.
 * @param date
 */
export function dateToISOStringWithLocalTZ( date: Date ): string {
	return dateToISOStringWithTZ( date, reportingTimeZone() );
}
