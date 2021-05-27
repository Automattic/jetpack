// Needed to use transpiled generator functions.
// See: https://babeljs.io/docs/en/babel-polyfill for details.
require( 'regenerator-runtime/runtime' );

if ( ! window.matchMedia ) {
	Object.defineProperty( window, 'matchMedia', {
		writable: true,
		value: jest.fn().mockImplementation( query => ( {
			matches: false,
			media: query,
			onchange: null,
			addListener: jest.fn(), // deprecated
			removeListener: jest.fn(), // deprecated
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		} ) ),
	} );
}
