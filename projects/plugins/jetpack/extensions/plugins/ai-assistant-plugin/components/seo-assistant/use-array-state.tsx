/**
 * External dependencies
 */
import { useCallback, useState } from '@wordpress/element';

/**
 * Custom hook to manage an array of values with index-based updates
 * @param initialValue - Initial array value or function
 * @return [values, setValue]
 */
export const useArrayState = < T, >( initialValue: T[] | ( () => T[] ) ) => {
	const [ values, setValues ] = useState< T[] >( initialValue || [] );

	const setValue = useCallback( ( value: T | ( ( prev: T ) => T ), index: number = 0 ) => {
		setValues( previousValues => {
			const next = [ ...previousValues ];

			next[ index ] =
				typeof value === 'function'
					? ( value as ( previousValue: T ) => T )( previousValues[ index ] )
					: value;

			return next;
		} );
	}, [] );

	return [ values, setValue ] as const;
};
