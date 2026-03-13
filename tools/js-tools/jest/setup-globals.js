/* global window */
if ( globalThis.window ) {
	// https://github.com/jsdom/jsdom/issues/3522
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

	// Needed by various Gutenberg packages
	// https://github.com/jsdom/jsdom/issues/3368
	if ( ! global.ResizeObserver ) {
		global.ResizeObserver = class ResizeObserver {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	}
}
