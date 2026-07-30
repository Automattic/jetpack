/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';

/**
 * The site's timezone, as an identifier `Intl` accepts.
 *
 * Sites configured with a manual UTC offset instead of a city have no
 * `timezone_string` at all, so WordPress sends an empty string and carries the
 * zone in `offset` alone. `Intl` rejects `''` as a `timeZone`, so the offset is
 * rendered as a fixed `±HH:MM` identifier instead.
 *
 * This reads the same settings `formatDate` renders in, so a range built here
 * and a single date formatted there agree on the calendar day. Note that
 * `getSiteTimezone()` in `@jetpack-premium-analytics/data` answers the same
 * question from a different source — the core-data `root/site` entity, falling
 * back to the *browser* zone before it loads — so it cannot replace this
 * settings-backed accessor.
 *
 * @return An IANA zone name, or a `±HH:MM` offset.
 */
export function siteTimeZone(): string {
	const { string: name, offset } = getSettings().timezone;

	if ( name ) {
		return name;
	}

	const sign = offset < 0 ? '-' : '+';
	const totalMinutes = Math.round( Math.abs( offset ) * 60 );
	const hours = String( Math.floor( totalMinutes / 60 ) ).padStart( 2, '0' );
	const minutes = String( totalMinutes % 60 ).padStart( 2, '0' );

	return `${ sign }${ hours }:${ minutes }`;
}
