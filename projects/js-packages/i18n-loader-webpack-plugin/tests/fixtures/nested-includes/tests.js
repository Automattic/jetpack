/* global jpI18nLoader */
test( 'Tests', async () => {
	const main = require( './dist/main.js' );

	jpI18nLoader.expectI18n( 'dist/hasI18n.js', require( './en_piglatin.json' ) );
	expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
} );
