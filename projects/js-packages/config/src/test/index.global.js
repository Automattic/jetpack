describe( 'jetpackConfig provided as a global', () => {
	// eslint-disable-next-line no-console
	const oldError = console.error;
	const spyError = jest.fn();
	let jetpackConfigGet, jetpackConfigHas;
	globalThis.jetpackConfig = { consumer_slug: 'from-global' };
	try {
		// eslint-disable-next-line no-console
		console.error = spyError;
		( { jetpackConfigGet, jetpackConfigHas } = require( '../' ) );
	} finally {
		// eslint-disable-next-line no-console
		console.error = oldError;
	}

	it( 'does not log an error on inclusion', () => {
		expect( spyError ).not.toHaveBeenCalled();
	} );

	it( 'jetpackConfigGet reads the global value', () => {
		expect( jetpackConfigGet( 'consumer_slug' ) ).toBe( 'from-global' );
	} );

	it( 'jetpackConfigHas does not report the missing-config marker', () => {
		expect( jetpackConfigHas( 'missingConfig' ) ).toBe( false );
	} );
} );
