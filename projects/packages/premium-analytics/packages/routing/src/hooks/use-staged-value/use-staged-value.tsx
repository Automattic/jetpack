/**
 * External dependencies
 */
import { useCallback, useMemo, useRef, useState } from 'react';

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

function definedKeys( o: AnyObject ) {
	return Object.keys( o ).filter( k => o[ k ] !== undefined );
}

// A key held as `undefined` is counted out: the URL binding serializes it away,
// so a draft that cleared one equals a store that never carried it (WOOA7S-2039).
function sameValues( a: AnyObject, b: AnyObject ) {
	if ( a === b ) {
		return true;
	}

	const ak = definedKeys( a );
	if ( ak.length !== definedKeys( b ).length ) {
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
	 * The draft is a patch over the store, never a copy of it: a `revert` queued
	 * before a commit lands would write the pre-commit value back over the
	 * realign below, which only fires while `committed` changes (WOOA7S-2064).
	 */
	const [ patch, setPatch ] = useState< Partial< TValue > >( {} );

	/*
	 * A control can stage and commit in the same tick — `DatePeriodDropdown` does
	 * that to apply a quick preset — so `commit` reads these refs, not the state
	 * React has only queued, which would leave the store a click behind.
	 */
	const patchRef = useRef< Partial< TValue > >( patch );
	const committedRef = useRef< TValue >( committed );
	committedRef.current = committed;

	/*
	 * Drop the draft when a committed value arrives from outside, or the next
	 * commit puts it back over the change. Held in state, not a ref: React may
	 * run this render twice and throw the first away, and a ref written during
	 * the discarded pass would swallow the realign it just decided on.
	 */
	const [ lastCommitted, setLastCommitted ] = useState< TValue >( committed );
	if ( ! sameValues( lastCommitted, committed ) ) {
		setLastCommitted( committed );
		patchRef.current = {};
		setPatch( patchRef.current );
	}

	const staged = useMemo( () => ( { ...committed, ...patch } ), [ committed, patch ] );

	/*
	 * A patch that only clears keys the draft does not carry changes nothing, so
	 * dropping it here keeps `commit` from pushing a history entry for a no-op.
	 */
	const stage = useCallback( ( next: Partial< TValue > ) => {
		const draft = { ...committedRef.current, ...patchRef.current } as AnyObject;
		const changes = Object.fromEntries(
			Object.entries( next ).filter(
				( [ key, value ] ) => value !== undefined || draft[ key ] !== undefined
			)
		) as Partial< TValue >;

		if ( Object.keys( changes ).length === 0 ) {
			return;
		}

		patchRef.current = { ...patchRef.current, ...changes };
		setPatch( patchRef.current );
	}, [] );

	const commit = useCallback(
		( options?: TCommitOptions ) => {
			if ( Object.keys( patchRef.current ).length === 0 ) {
				return;
			}

			onCommit( { ...committedRef.current, ...patchRef.current }, patchRef.current, options );
		},
		[ onCommit ]
	);

	const revert = useCallback( () => {
		if ( Object.keys( patchRef.current ).length === 0 ) {
			return;
		}

		patchRef.current = {};
		setPatch( patchRef.current );
	}, [] );

	const isDirty = Object.keys( patchRef.current ).length > 0 && ! sameValues( staged, committed );

	return { staged, isDirty, stage, commit, revert };
}
