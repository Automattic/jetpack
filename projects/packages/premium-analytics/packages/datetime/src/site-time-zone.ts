/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';

/**
 * The site's timezone, as an identifier `Intl` accepts.
 *
 * This is the only accessor for the site zone. It reads the settings WordPress
 * installs synchronously at page load — the same ones every formatter renders
 * in — so date maths and rendered labels agree on the calendar day from the
 * first paint, with no entity fetch to wait on.
 *
 * Sites configured with a manual UTC offset instead of a city have no
 * `timezone_string` at all, so WordPress sends an empty string and carries the
 * zone in `offset` alone. `Intl` rejects `''` as a `timeZone`, so the offset is
 * rendered as a fixed `±HH:MM` identifier instead. Absent settings entirely,
 * `@wordpress/date`'s own defaults yield `+00:00`: never the visitor's zone,
 * which is never the right answer for a site-scoped value.
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
