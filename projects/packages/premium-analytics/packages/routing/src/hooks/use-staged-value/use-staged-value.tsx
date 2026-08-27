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

export function shallowEqual( a: AnyObject | undefined, b: AnyObject | undefined ) {
	if ( a === b ) {
		return true;
	}

	if ( ! a || ! b ) {
		return false;
	}

	const ak = Object.keys( a );
	const bk = Object.keys( b );
	if ( ak.length !== bk.length ) {
		return false;
	}

	for ( const k of ak ) {
		if ( a[ k ] !== b[ k ] ) {
			return false;
		}
	}

	return true;
}

/**
 * Stage edits to a value and commit them in one go, whatever holds the value.
 *
 * The store is the caller's: `onCommit` receives the whole draft and the patch
 * accumulated since the last commit, so a URL binding can navigate with the
 * patch while an attribute binding saves the draft. `useStagedSearch` is the
 * URL binding; `ReportParamsControl` binds a widget attribute.
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
	 * exactly that to apply a quick preset — so `commit` reads these refs rather
	 * than the state React has only queued, which would still hold the previous
	 * selection and leave the store a click behind. The state drives the render.
	 */
	const stagedRef = useRef< TValue >( committed );
	const patchRef = useRef< Partial< TValue > >( {} );
	const [ staged, setStaged ] = useState< TValue >( committed );

	/*
	 * Realign on a committed value arriving from outside — an undo, a reset,
	 * another surface writing the same store. Without it the next commit puts
	 * the stale draft back over that change. Compared by value rather than
	 * identity: a host that rebuilds the value during render would otherwise
	 * wipe the draft on every render.
	 */
	const lastCommittedRef = useRef< TValue >( committed );
	if ( ! shallowEqual( lastCommittedRef.current, committed ) ) {
		lastCommittedRef.current = committed;
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

	const isDirty = Object.keys( patchRef.current ).length > 0 && ! shallowEqual( staged, committed );

	return { staged, isDirty, stage, commit, revert };
}
