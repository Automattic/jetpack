jest.mock(
	'jetpackConfig',
	() => ( {
		something: 'is set',
	} ),
	{ virtual: true }
);

describe( 'jetpackConfig provided', () => {
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

	it( 'does not log an error on inclusion', () => {
		expect( spyError ).not.toHaveBeenCalled();
	} );

	it( 'jetpackConfigGet gets existing variable', () => {
		expect( jetpackConfigGet( 'something' ) ).toBe( 'is set' );
	} );

	it( 'jetpackConfigHas should return true for existing entry', () => {
		expect( jetpackConfigHas( 'something' ) ).toBe( true );
	} );

	it( 'jetpackConfigHas should return false for non existing entry', () => {
		expect( jetpackConfigHas( 'missingConfig' ) ).toBe( false );
	} );

	it( 'should throw if getting key that does not exist', () => {
		expect( () => {
			jetpackConfigGet( 'unknown' );
		} ).toThrow(
			'This app requires the "unknown" Jetpack Config to be defined in your webpack configuration file. See details in @automattic/jetpack-config package docs.'
		);
	} );
} );
