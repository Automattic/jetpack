// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallbackFunction = ( ...args: any[] ) => void;

/**
 * Debounce call to a function.
 *
 * Delay a function call by specified number of milliseconds. If called subsequent times before the wait time is over
 * reset the timer. Useful to prevent same action executing multiple times when one final call is enough.
 *
 * @param {Function} callback The function to call.
 * @param {number}   wait     Number of milliseconds to wait.
 * @return {Function} Debounced function.
 */
export function debounce( callback: CallbackFunction, wait: number ): CallbackFunction {
	let timer: number;

	return function ( ...args ) {
		clearTimeout( timer );
		timer = setTimeout( () => callback.apply( this, args ), wait );
	};
}

export function once( callback: CallbackFunction ): [ CallbackFunction, () => void ] {
	let called = false;

	const fn = function ( ...args ) {
		if ( called ) {
			return;
		}

		called = true;
		callback.apply( this, args );
	};

	return [ fn, () => ( called = false ) ];
}
