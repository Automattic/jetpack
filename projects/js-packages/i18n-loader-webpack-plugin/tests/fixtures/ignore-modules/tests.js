/* global jpI18nLoader, wpI18n */

describe( 'Test ignoreModules as', () => {
	beforeEach( () => {
		wpI18n.resetLocaleData( {}, 'ignore-modules' );
	} );

	const whats = [ 'string', 'regex', 'function', 'array' ];
	test.each( whats )( 'a %s', async what => {
		const main = require( `./dist/${ what }/main.js` );
		const main2 = require( `./dist/${ what }/main2.js` );

		expect( await main.noI18n() ).toEqual( 'No i18n here' );
		expect( await main.hasI18n() ).toEqual( 'This is translated' );

		expect( await main2.hasI18n() ).toEqual( 'This is translated' );
		jpI18nLoader.expectI18n( `dist/${ what }/hasI18n2.js`, require( './en_piglatin.json' ) );
		expect( await main2.hasI18n2() ).toEqual( 'is-Thay is-way anslated-tray oo-tay' );
	} );
} );
