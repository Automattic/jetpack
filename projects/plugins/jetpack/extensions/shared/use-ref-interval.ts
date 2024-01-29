import { useCallback, useEffect, useRef } from '@wordpress/element';

interface RafHandle {
	id: number;
}

const setRafInterval = ( callback: () => void, timeout: number = 0 ) => {
	const interval = timeout < 0 ? 0 : timeout;
	const handle: RafHandle = {
		id: 0,
	};

	let startTime = Date.now();

	const loop = () => {
		const nowTime = Date.now();
		if ( nowTime - startTime >= interval ) {
			startTime = nowTime;
			callback();
		}

		handle.id = requestAnimationFrame( loop );
	};

	handle.id = requestAnimationFrame( loop );

	return handle;
};

const clearRafInterval = ( handle?: RafHandle | null ) => {
	if ( handle ) {
		cancelAnimationFrame( handle.id );
	}
};

/**
 * Invoke a function on an interval that uses requestAnimationFrame.
 *
 * @param {Function} callback - Function to invoke
 * @param {number} timeout - Interval timout in MS.
 *
 * @returns {Function} Function to clear the interval.
 */
const useRafInterval = ( callback: () => void, timeout = 0 ) => {
	const timerRef = useRef< RafHandle >();

	const callbackRef = useRef( callback );
	callbackRef.current = callback;

	useEffect( () => {
		timerRef.current = setRafInterval( () => {
			callbackRef.current();
		}, timeout );

		return () => {
			clearRafInterval( timerRef.current );
		};
	}, [ timeout ] );

	const clear = useCallback( () => {
		clearRafInterval( timerRef.current );
	}, [] );

	return clear;
};

export default useRafInterval;
