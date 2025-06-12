/**
 * @file Utility functions for function manipulation.
 */

/**
 * bufferFn buffers calls to fn so they only happen every ms milliseconds
 *
 * @param {number}   ms number of milliseconds
 * @param {function} fn the function to be buffered
 * @returns {function}
 */
export function bufferFn( ms: number, fn: ( ...args: unknown[] ) => unknown ) {
	let timeout: ReturnType< typeof setTimeout > | undefined;
	return function () {
		clearTimeout( timeout );
		timeout = setTimeout( fn, ms );
	};
}

/**
 * noop is a function which does nothing at all.
 */
export function noop() {}

/**
 * copy properties from object o2 to object o1.
 *
 * @params {Object} o1
 * @params {Object} o2
 * @returns {Object}
 */
export function cp( ...args: Record< object, unknown >[] ) {
	const o1 = args[ 0 ];
	for ( let i = 1; i < args.length; ++i ) {
		const o2 = args[ i ] || {};
		for ( const key in o2 ) {
			o1[ key ] = o2[ key ];
		}
	}
	return o1;
}
