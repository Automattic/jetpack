/**
 * External dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
/**
 * Types
 */
import type { Dispatch, SetStateAction } from 'react';

/**
 * A list setter that also flags the list as locally edited, so a still-in-flight
 * open-fetch won't overwrite the optimistic change with a now-stale snapshot.
 */
export type LocalEditSetter< T > = Dispatch< SetStateAction< T > >;

/**
 * Guard an optimistically-mutated list against an in-flight open-fetch.
 *
 * @param setValue - Raw state setter for the guarded list.
 * @return The local-edits flag ref, a guarded setter, and a flag reset.
 */
export function useLocalEditGuard< T >( setValue: Dispatch< SetStateAction< T > > ) {
	const hasLocalEditsRef = useRef( false );

	const setWithGuard = useCallback< LocalEditSetter< T > >(
		value => {
			hasLocalEditsRef.current = true;
			setValue( value );
		},
		[ setValue ]
	);

	const resetLocalEdits = useCallback( () => {
		hasLocalEditsRef.current = false;
	}, [] );

	return { hasLocalEditsRef, setWithGuard, resetLocalEdits };
}
