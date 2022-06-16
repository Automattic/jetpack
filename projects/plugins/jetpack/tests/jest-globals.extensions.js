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

// Needed to mock a new global added by Gutenberg G2 components.
if ( ! window.CSS ) {
	window.CSS = {
		escape: () => false,
		supports: () => false,
	};
}

// Needed by `@wordpress/compose' >=5.7.0
if ( ! global.ResizeObserver ) {
	global.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
