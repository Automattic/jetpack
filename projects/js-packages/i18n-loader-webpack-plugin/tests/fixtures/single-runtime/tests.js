/* global jpI18nLoader */
test( 'Tests', async () => {
	const main = require( './dist/main.js' );
	const main2 = require( './dist/main2.js' );
	const bar = require( './dist/bar.js' );
	const baz = require( './dist/baz.js' );
	const translations = require( './en_piglatin.json' );

	expect( await main.noI18n() ).toEqual( 'No i18n here' );

	jpI18nLoader.expectI18n( 'dist/hasI18n.js', translations );
	expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );

	jpI18nLoader.expectI18n( 'dist/hasI18n2.js', translations );
	expect( await main2.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
	expect( await main2.hasI18n2() ).toEqual( 'is-Thay is-way anslated-tray oo-tay' );

	expect( bar ).toEqual( 'No submodules here' );

	expect( await baz.noI18n() ).toEqual( 'No i18n here' );
} );
