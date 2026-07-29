/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';

/**
 * The site's timezone, as an identifier `@date-fns/tz` accepts.
 *
 * Sites configured with a manual UTC offset instead of a city have no
 * `timezone_string` at all, so WordPress sends an empty string and carries the
 * zone in `offset` alone. Anchoring a date to `''` yields an invalid date, so
 * the offset is rendered as a fixed `±HH:MM` identifier instead.
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
