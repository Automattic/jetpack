// Suppress console errors from WordPress Jetpack Connection package errors.
/* eslint-disable no-console */
const originalConsoleError = console.error;
console.error = ( ...args ) => {
	if ( typeof args[ 0 ] === 'string' && args[ 0 ].includes( 'Initial state is missing' ) ) {
		return;
	}
	originalConsoleError.apply( console, args );
};
/* eslint-enable no-console */
