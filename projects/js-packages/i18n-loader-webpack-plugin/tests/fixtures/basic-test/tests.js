test( 'Tests', async () => {
	const main = require( './dist/main.js' );
	const bar = require( './dist/bar.js' );
	const baz = require( './dist/baz.js' );
	const translations = require( './en_piglatin.json' );

	expect( await main.noI18n() ).toEqual( 'No i18n here' );

	fetch.expectUrl(
		'http://test.example.com/wp-content/languages/plugins/basic-test-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
		translations
	);
	expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
	expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );

	expect( bar ).toEqual( 'No submodules here' );

	expect( await baz.noI18n() ).toEqual( 'No i18n here' );
} );
