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
