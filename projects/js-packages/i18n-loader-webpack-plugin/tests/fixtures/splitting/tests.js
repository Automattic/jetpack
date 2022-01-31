/* global jpI18nLoader */
test( 'Tests', async () => {
	const main = require( './dist/main.js' );
	const main2 = require( './dist/main2.js' );
	const translations = require( './en_piglatin.json' );

	jpI18nLoader.expectI18n( 'dist/src_hasI18n_js-src_hasI18n2_js.js', translations );
	expect( ( await main() ).a ).toEqual( 'is-Thay is-way anslated-tray' );
	expect( ( await main() ).b ).toEqual( 'is-Thay is-way anslated-tray oo-tay' );

	jpI18nLoader.expectI18n( 'dist/src_hasI18n_js-src_hasI18n2_js.js', translations );
	expect( ( await main2() ).x ).toEqual( 'is-Thay is-way anslated-tray' );
	expect( ( await main2() ).y ).toEqual( 'is-Thay is-way anslated-tray oo-tay' );
} );
