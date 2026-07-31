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
			'jpa/email-time-series--total-opens': 'Total opens',
			'jpa/email-time-series--total-clicks': 'Total clicks',
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

	it( 'keeps every variant name unique so the host resolves each independently', () => {
		const names = POST_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
			variants.map( variant => variant.name )
		);

		expect( new Set( names ).size ).toBe( names.length );
	} );
} );
