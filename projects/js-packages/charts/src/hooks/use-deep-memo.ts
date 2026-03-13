import isEqual from 'fast-deep-equal';
import { useRef } from 'react';

/**
 * Custom hook to memoize a value using deep equality comparison.
 * Prevents unnecessary re-renders when objects have the same content but different references.
 *
 * @param value - The value to memoize with deep equality comparison
 * @return The memoized value that only changes when deeply different
 */
export const useDeepMemo = < T >( value: T ): T => {
	const ref = useRef< T >( value );

	if ( ! isEqual( ref.current, value ) ) {
		ref.current = value;
	}

	return ref.current;
};
