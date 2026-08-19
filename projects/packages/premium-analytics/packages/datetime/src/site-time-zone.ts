/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';

/**
 * Get the site's timezone from WordPress date settings.
 *
 * Sites configured with a UTC offset have no timezone name, so format their
 * offset as an identifier accepted by `Intl`.
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
