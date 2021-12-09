test( 'Tests', async () => {
	const main = require( './dist/main.js' );
	fetch.expectUrl(
		'http://example.org/options-en_piglatin-e54fa518d005a9d82f46a567822e8600.json',
		require( './en_piglatin.json' )
	);
	expect( await main.hasI18n() ).toEqual( 'is-Thay is-way anslated-tray' );
} );
