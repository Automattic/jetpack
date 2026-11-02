import { getCalypsoUrl, getTab } from '../tabs';

describe( 'getTab', () => {
	it.each( [ undefined, 'settings', 42 ] )( 'falls back to Overview for %p', value => {
		expect( getTab( value ).value ).toBe( 'overview' );
	} );
} );

describe( 'getCalypsoUrl', () => {
	it.each( [
		[ 'overview', 'example.com', 'https://wordpress.com/earn/example.com' ],
		[ 'subscribers', 'example.com', 'https://wordpress.com/earn/paid-subscriptions/example.com' ],
		[ 'ads', 'example.com', 'https://wordpress.com/earn/ads-earnings/example.com' ],
	] )( 'links %s on %s to %s', ( tab, siteSlug, url ) => {
		expect( getCalypsoUrl( getTab( tab ), siteSlug ) ).toBe( url );
	} );
} );
