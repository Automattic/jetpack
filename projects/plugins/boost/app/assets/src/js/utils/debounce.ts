/**
 * Debounce call to a function.
 *
 * Delay a function call by specified number of milliseconds. If called subsequent times before the wait time is over
 * reset the timer. Useful to prevent same action executing multiple times when one final call is enough.
 *
 * @param {Function} callback The function to call.
 * @param {number}   wait     Number of milliseconds to wait.
 */
export default function debounce( callback, wait ) {
	let timer;

	return function ( ...args ) {
		const context = this;
		clearTimeout( timer );
		timer = setTimeout( () => callback.apply( context, args ), wait );
	};
}
