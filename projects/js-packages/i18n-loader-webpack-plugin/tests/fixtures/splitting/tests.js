test( 'Tests', async () => {
	const main = require( './dist/main.js' );
	const main2 = require( './dist/main2.js' );
	const translations = require( './en_piglatin.json' );

	fetch.expectUrl(
		'http://test.example.com/wp-content/languages/plugins/splitting-en_piglatin-ec0e6fc1bae1bb5c76db79838b127a36.json',
		translations
	);
	expect( ( await main() ).a ).toEqual( 'is-Thay is-way anslated-tray' );
	expect( ( await main() ).b ).toEqual( 'is-Thay is-way anslated-tray oo-tay' );

	fetch.expectUrl(
		'http://test.example.com/wp-content/languages/plugins/splitting-en_piglatin-ec0e6fc1bae1bb5c76db79838b127a36.json',
		translations
	);
	expect( ( await main2() ).x ).toEqual( 'is-Thay is-way anslated-tray' );
	expect( ( await main2() ).y ).toEqual( 'is-Thay is-way anslated-tray oo-tay' );
} );
