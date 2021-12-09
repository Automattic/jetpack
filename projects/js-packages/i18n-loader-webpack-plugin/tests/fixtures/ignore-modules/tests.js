/* global wpI18n */
const { default: md5 } = require( 'md5-es' );

describe( 'Test ignoreModules as', () => {
	beforeEach( () => {
		wpI18n.resetLocaleData( {}, 'ignore-modules' );
	} );

	const whats = [ 'string', 'regex', 'function', 'array' ];
	test.each( whats )( 'a %s', async what => {
		const main = require( `./dist/${ what }/main.js` );
		const main2 = require( `./dist/${ what }/main2.js` );
		const hash = md5.hash( `dist/${ what }/hasI18n2.js` );

		expect( await main.noI18n() ).toEqual( 'No i18n here' );
		expect( await main.hasI18n() ).toEqual( 'This is translated' );

		expect( await main2.hasI18n() ).toEqual( 'This is translated' );
		fetch.expectUrl(
			`http://test.example.com/wp-content/languages/plugins/ignore-modules-en_piglatin-${ hash }.json`,
			require( './en_piglatin.json' )
		);
		expect( await main2.hasI18n2() ).toEqual( 'is-Thay is-way anslated-tray oo-tay' );
	} );
} );
