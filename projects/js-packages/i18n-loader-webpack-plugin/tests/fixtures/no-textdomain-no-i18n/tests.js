test( 'Tests', async () => {
	const bar = require( './dist/bar.js' );
	const baz = require( './dist/baz.js' );

	expect( bar ).toEqual( 'No submodules here' );
	expect( await baz.noI18n() ).toEqual( 'No i18n here' );
} );
