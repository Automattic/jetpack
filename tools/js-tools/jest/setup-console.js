// Mocks and noops `console.log`, `console.info`, `console.warn`, and `console.error`.
// Also, if any of those get called, the test will fail unless it did the appropriate tests of
//
// `expect( console ).toHaveLogged()` or `expect( console ).toHaveLoggedWith( msg )`
// `expect( console ).toHaveInformed()` or `expect( console ).toHaveInformedWith( msg )`
// `expect( console ).toHaveWarned()` or `expect( console ).toHaveWarnedWith( msg )`
// `expect( console ).toHaveErrored()` or `expect( console ).toHaveErroredWith( msg )`
//
// Note `console.debug` and `console.trace` are not mocked, and so may be used for debugging.
// Adapted from `@wordpress/jest-console` v9.3.0 after its deprecation.

/**
 * Create a matcher asserting calls to a console method.
 *
 * @param {string}  methodName - Console method name.
 * @param {boolean} withArgs   - Whether the matcher checks call arguments.
 * @return {Function} Jest matcher.
 */
function createMatcher( methodName, withArgs ) {
	return function ( received, ...expected ) {
		const { calls } = received[ methodName ].mock;
		// Tells the `afterEach` guard below that this test expected these calls.
		asserted.add( methodName );
		// JSON substring match, so `required-review` can also pass the full list of calls.
		const pass = withArgs
			? JSON.stringify( calls ).includes( JSON.stringify( expected ) )
			: calls.length > 0;
		const args = withArgs ? ` with ${ this.utils.printExpected( expected ) }` : '';
		return {
			pass,
			message: () =>
				// The message only shows on failure, so `pass` being true means `.not` was used.
				`Expected console.${ methodName }() ${ pass ? 'not ' : '' }to be called${ args }.\n` +
				`Calls: ${ this.utils.printReceived( calls ) }`,
		};
	};
}

const asserted = new Set();

const matcherNames = {
	error: 'toHaveErrored',
	info: 'toHaveInformed',
	log: 'toHaveLogged',
	warn: 'toHaveWarned',
};

for ( const [ methodName, matcherName ] of Object.entries( matcherNames ) ) {
	const spy = jest.spyOn( console, methodName ).mockImplementation( () => {} );

	expect.extend( {
		[ matcherName ]: createMatcher( methodName, false ),
		[ `${ matcherName }With` ]: createMatcher( methodName, true ),
	} );

	// Ignore calls made while loading test files.
	beforeAll( () => spy.mockClear() );

	afterEach( () => {
		try {
			if ( ! asserted.has( methodName ) && spy.mock.calls.length > 0 ) {
				// eslint-disable-next-line jest/no-standalone-expect
				expect( console ).not[ matcherName ]();
			}
		} finally {
			spy.mockClear();
			asserted.delete( methodName );
		}
	} );
}
