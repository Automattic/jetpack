// Needed to use transpiled generator functions.
// See: https://babeljs.io/docs/en/babel-polyfill for details.
require( 'regenerator-runtime/runtime' );

if ( ! window.matchMedia ) {
	window.matchMedia = query => ( {
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	} );
}

// Currently needed for testing jetpack blocks against new versions of Gutenberg.
if ( ! window.CSS ) {
	window.CSS = {
		escape: () => false,
		supports: () => false,
	};
}
