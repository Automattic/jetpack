describe( 'jetpackConfig missing', () => {
	// eslint-disable-next-line no-console
	const oldError = console.error;
	const spyError = jest.fn();
	let jetpackConfigGet, jetpackConfigHas;
	try {
		// eslint-disable-next-line no-console
		console.error = spyError;
		( { jetpackConfigGet, jetpackConfigHas } = require( '../' ) );
	} finally {
		// eslint-disable-next-line no-console
		console.error = oldError;
	}

	it( 'logs an error on inclusion', () => {
		expect( spyError ).toHaveBeenCalledWith(
			'jetpackConfig is missing in your webpack config file. See @automattic/jetpack-config'
		);
	} );

	it( 'jetpackConfigGet gets existing variable', () => {
		expect( jetpackConfigGet( 'missingConfig' ) ).toBe( true );
	} );

	it( 'jetpackConfigHas should return true for existing entry', () => {
		expect( jetpackConfigHas( 'missingConfig' ) ).toBe( true );
	} );

	it( 'jetpackConfigHas should return false for non existing entry', () => {
		expect( jetpackConfigHas( 'unknown' ) ).toBe( false );
	} );

	it( 'should throw if getting key that does not exist', () => {
		expect( () => {
			jetpackConfigGet( 'unknown' );
		} ).toThrow(
			'This app requires the "unknown" Jetpack Config to be defined in your webpack configuration file. See details in @automattic/jetpack-config package docs.'
		);
	} );
} );
