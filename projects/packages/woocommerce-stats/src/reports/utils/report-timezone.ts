/**
 * External dependencies
 */
import { getSettings } from '@wordpress/date';

/**
 * The timezone the store reports are read in: the site's own, which is the one
 * WooCommerce buckets them in.
 *
 * @return An IANA zone name, or a `±HH:MM` offset for a site set to a UTC offset.
 */
export function resolveReportTimeZone(): string {
	const { string: name, offset } = getSettings().timezone;

	if ( name ) {
		return name;
	}

	const hours = Number( offset );
	const sign = hours < 0 ? '-' : '+';
	const totalMinutes = Math.round( Math.abs( hours ) * 60 );
	const hh = String( Math.floor( totalMinutes / 60 ) ).padStart( 2, '0' );
	const mm = String( totalMinutes % 60 ).padStart( 2, '0' );

	return `${ sign }${ hh }:${ mm }`;
}
