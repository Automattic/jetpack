test( 'Tests', async () => {
	const main = require( './dist/main.js' );

	fetch.expectUrl(
		'http://test.example.com/wp-content/languages/plugins/nested-includes-en_piglatin-c7c3968298452ee95564fb9c05e2de50.json',
		require( './en_piglatin.json' )
	);
	expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
} );
