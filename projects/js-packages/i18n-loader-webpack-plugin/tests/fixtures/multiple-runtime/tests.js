test( 'Tests', async () => {
	const main = require( './dist/main.js' );
	const main2 = require( './dist/main2.js' );
	const bar = require( './dist/bar.js' );
	const baz = require( './dist/baz.js' );
	const translations = require( './en_piglatin.json' );

	expect( await main.noI18n() ).toEqual( 'No i18n here' );

	fetch.expectUrl(
		'http://test.example.com/wp-content/languages/plugins/multiple-runtime-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
		translations
	);
	expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );

	fetch.expectUrl(
		'http://test.example.com/wp-content/languages/plugins/multiple-runtime-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
		translations
	);
	expect( await main2.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
	fetch.expectUrl(
		'http://test.example.com/wp-content/languages/plugins/multiple-runtime-en_piglatin-71d7bd53fc0961d2785c69cde5d9fead.json',
		translations
	);
	expect( await main2.hasI18n2() ).toEqual( 'is-Thay is-way anslated-tray oo-tay' );

	expect( bar ).toEqual( 'No submodules here' );

	expect( await baz.noI18n() ).toEqual( 'No i18n here' );
} );
