import { useEffect, useRef } from '@wordpress/element';

/**
 * Invoke a function on an interval.
 *
 * @param {Function} callback - Function to invoke
 * @param {number} delay    - Interval timout in MS. `null` or `false` to stop the interval.
 */
export default function useInterval( callback, delay ) {
	const savedCallback = useRef( callback );

	// Remember the latest callback.
	useEffect( () => {
		savedCallback.current = callback;
	}, [ callback ] );

	// Set up the interval.
	useEffect( () => {
		if ( delay === null || delay === false ) {
			return;
		}
		const tick = () => void savedCallback.current();
		const id = setInterval( tick, delay );
		return () => clearInterval( id );
	}, [ delay ] );
}
