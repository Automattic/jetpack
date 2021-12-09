/* global wpI18n */

describe( 'Tests', () => {
	afterEach( () => {
		wpI18n.resetLocaleData( {}, 'manual-externals' );
	} );

	test( 'External from the global', async () => {
		const main = require( './dist/main.js' );
		fetch.expectUrl(
			'http://test.example.com/wp-content/languages/plugins/manual-externals-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
			require( './en_piglatin.json' )
		);
		expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
	} );

	test( 'Hard-coded "external", with locale en_US', async () => {
		const main2 = require( './dist/main2.js' );
		expect( await main2.hasI18n() ).toEqual( 'This is translated' );
	} );

	test( 'Hard-coded "external", with different baseUrl, locale, and domainMap', async () => {
		const main3 = require( './dist/main3.js' );
		fetch.expectUrl(
			'http://example.org/themes/remapped-en_us-c7c3968298452ee95564fb9c05e2de50.json',
			require( './en_us.json' )
		);
		expect( await main3.hasI18n() ).toEqual( 'Thus us trunslutud' );
	} );
} );
