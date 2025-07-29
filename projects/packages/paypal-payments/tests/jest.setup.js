// Mock window.matchMedia
Object.defineProperty( window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation( query => ( {
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	} ) ),
} );

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
	observe() {
		return null;
	}
	unobserve() {
		return null;
	}
	disconnect() {
		return null;
	}
};

// Suppress console errors from WordPress store registration conflicts
/* eslint-disable no-console */
const originalConsoleError = console.error;
console.error = ( ...args ) => {
	// Suppress specific WordPress store registration errors and Jetpack Connection package errors
	if (
		typeof args[ 0 ] === 'string' &&
		( args[ 0 ].includes( 'is already registered' ) ||
			args[ 0 ].includes( 'Initial state is missing' ) )
	) {
		return;
	}
	originalConsoleError.apply( console, args );
};
/* eslint-enable no-console */
