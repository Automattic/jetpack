/**
 * External dependencies
 */
import { useCallback, useRef, useState } from 'react';

type AnyObject = Record< string, unknown >;

export type UseStagedValueReturn< TValue, TCommitOptions > = {
	/**
	 * The draft: the committed value with every staged patch applied.
	 */
	staged: TValue;

	/**
	 * Whether the draft holds anything the store has not taken yet.
	 */
	isDirty: boolean;

	/**
	 * Record a patch on the draft, leaving the store untouched.
	 */
	stage: ( patch: Partial< TValue > ) => void;

	/**
	 * Hand the draft to the store.
	 */
	commit: ( options?: TCommitOptions ) => void;

	/**
	 * Throw the draft away and start again from the committed value.
	 */
	revert: () => void;
};

function sameValue( a: unknown, b: unknown ) {
	if ( a === b ) {
		return true;
	}

	// `ReportParams.filters` is an array, so identity is not enough: a host that
	// rebuilds the value during render would realign on every render.
	return (
		typeof a === 'object' && typeof b === 'object' && JSON.stringify( a ) === JSON.stringify( b )
	);
}

function sameValues( a: AnyObject, b: AnyObject ) {
	if ( a === b ) {
		return true;
	}

	const ak = Object.keys( a );
	if ( ak.length !== Object.keys( b ).length ) {
		return false;
	}

	return ak.every( k => sameValue( a[ k ], b[ k ] ) );
}

/**
 * Stage edits to a value and commit them in one go, whatever holds the value.
 *
 * `onCommit` gets the patch as well as the draft, so a URL binding can navigate
 * with the patch alone and leave the params it does not own untouched.
 *
 * @param committed - The value the store currently holds.
 * @param onCommit  - Writes the draft to the store.
 * @return The draft and the controls that drive it.
 */
export function useStagedValue< TValue extends AnyObject, TCommitOptions = void >(
	committed: TValue,
	onCommit: ( staged: TValue, patch: Partial< TValue >, options?: TCommitOptions ) => void
): UseStagedValueReturn< TValue, TCommitOptions > {
	/*
	 * A control can stage and commit in the same tick — `DateRangeFilter` does
	 * that to apply a quick preset — so `commit` reads these refs, not the state
	 * React has only queued, which would leave the store a click behind.
	 */
	const stagedRef = useRef< TValue >( committed );
	const patchRef = useRef< Partial< TValue > >( {} );
	const [ staged, setStaged ] = useState< TValue >( committed );

	/*
	 * Realign when a committed value arrives from outside, or the next commit
	 * puts the stale draft back over it. Held in state, not a ref: React may run
	 * this render twice and throw the first away, and a ref written during the
	 * discarded pass would swallow the realign it just decided on.
	 */
	const [ lastCommitted, setLastCommitted ] = useState< TValue >( committed );
	if ( ! sameValues( lastCommitted, committed ) ) {
		setLastCommitted( committed );
		stagedRef.current = committed;
		patchRef.current = {};
		setStaged( committed );
	}

	const stage = useCallback( ( patch: Partial< TValue > ) => {
		stagedRef.current = { ...stagedRef.current, ...patch };
		patchRef.current = { ...patchRef.current, ...patch };
		setStaged( stagedRef.current );
	}, [] );

	const commit = useCallback(
		( options?: TCommitOptions ) => {
			if ( Object.keys( patchRef.current ).length === 0 ) {
				return;
			}

			onCommit( stagedRef.current, patchRef.current, options );
		},
		[ onCommit ]
	);

	const revert = useCallback( () => {
		stagedRef.current = committed;
		patchRef.current = {};
		setStaged( committed );
	}, [ committed ] );

	const isDirty = Object.keys( patchRef.current ).length > 0 && ! sameValues( staged, committed );

	return { staged, isDirty, stage, commit, revert };
}
