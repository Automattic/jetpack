/**
 * Internal dependencies
 */
import { siteTimeZone } from './site-time-zone';

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
