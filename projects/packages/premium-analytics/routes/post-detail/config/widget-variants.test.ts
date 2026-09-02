/**
 * External dependencies
 */
import { link, mapMarker, megaphone, desktop, seen } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { POST_DETAIL_WIDGET_TYPE_ALIASES } from './widget-variants';

describe( 'post detail widget type aliases', () => {
	it( 'titles every variant with its design-mock card title', () => {
		const titles = Object.fromEntries(
			POST_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
				variants.map( variant => [ variant.name, variant.getTitle() ] )
			)
		);

		expect( titles ).toEqual( {
			'jpa/email-time-series--total-opens': 'Opens, first 30 days',
			'jpa/email-time-series--total-clicks': 'Clicks, first 30 days',
			'jpa/email-breakdown--location-opens': 'Locations',
			'jpa/email-breakdown--platforms-opens': 'Platforms',
			'jpa/email-breakdown--clients-opens': 'Clients',
			'jpa/email-breakdown--location-clicks': 'Locations',
			'jpa/email-breakdown--platforms-clicks': 'Platforms',
			'jpa/email-breakdown--clients-clicks': 'Clients',
			'jpa/email-breakdown--top-links': 'Top links',
			'jpa/utm-insights--utm': 'UTM',
		} );
	} );

	it( 'gives every variant its design-mock icon, inheriting the base icon when unset', () => {
		const icons = Object.fromEntries(
			POST_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
				variants.map( variant => [ variant.name, variant.icon ] )
			)
		);

		expect( icons ).toEqual( {
			'jpa/email-time-series--total-opens': seen,
			'jpa/email-time-series--total-clicks': link,
			'jpa/email-breakdown--location-opens': mapMarker,
			'jpa/email-breakdown--platforms-opens': desktop,
			'jpa/email-breakdown--clients-opens': undefined,
			'jpa/email-breakdown--location-clicks': mapMarker,
			'jpa/email-breakdown--platforms-clicks': desktop,
			'jpa/email-breakdown--clients-clicks': undefined,
			'jpa/email-breakdown--top-links': link,
			'jpa/utm-insights--utm': megaphone,
		} );
	} );

	it( 'replaces the help note only on the pinned timeline variants', () => {
		const help = Object.fromEntries(
			POST_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
				variants.map( variant => [ variant.name, variant.getHelp?.().content ] )
			)
		);

		expect( help[ 'jpa/email-time-series--total-opens' ] ).toBe(
			'Daily opens for the 30 days after this email was sent. The totals above are all-time.'
		);
		expect( help[ 'jpa/email-time-series--total-clicks' ] ).toBe(
			'Daily clicks for the 30 days after this email was sent. The totals above are all-time.'
		);
		Object.entries( help )
			.filter( ( [ name ] ) => ! name.startsWith( 'jpa/email-time-series' ) )
			.forEach( ( [ , content ] ) => expect( content ).toBeUndefined() );
	} );

	it( 'keeps every variant name unique so the host resolves each independently', () => {
		const names = POST_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
			variants.map( variant => variant.name )
		);

		expect( new Set( names ).size ).toBe( names.length );
	} );
} );
