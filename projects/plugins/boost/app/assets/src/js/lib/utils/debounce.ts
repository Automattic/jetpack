import { useCallback, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

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
		timer = setTimeout( () => callback(...args), wait );
	};
}


/**
 * State hook that debounces a side effect on state change.
 * This is useful for side effects like mutations (API Calls) when the UI is changing rapidly.
 *
 * @param initialValue - initial value for the state
 * @param sideEffect   - side effect function that should run only after the state has not changed for the delay
 * @param delay        - debounce delay in milliseconds
 */
export function useDebouncedState<T>(initialValue: T, sideEffect: (v: T) => void, delay: number = 1000): [T, (v: T) => void] {
	const [value, setValueState] = useState<T>(initialValue);
	const debouncedSetValue = useDebouncedCallback(sideEffect, delay, { leading: true, trailing: true });

	const setValue = useCallback( (newValue: T) => {
		setValueState(newValue);
		debouncedSetValue(newValue);
	}, [debouncedSetValue]);

	return [value, setValue];
}
