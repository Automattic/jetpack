/**
 * @file Utility functions for function manipulation.
 */

/**
 * bufferFn buffers calls to fn so they only happen every ms milliseconds
 *
 * @param {number}   ms number of milliseconds
 * @param {Function} fn the function to be buffered
 * @returns {Function}
 */
export function bufferFn( ms: number, fn: ( ...args: unknown[] ) => unknown ): () => void {
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
