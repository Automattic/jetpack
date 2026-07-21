/**
 * External dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AnyObject = Record< string, unknown >;

export type UseStagedSearchOptions< TFrom extends string > = {
	from: TFrom; // e.g., '/',

	/**
	 * If provided, stage() will schedule an automatic debounced commit
	 * after the given milliseconds. Those auto-commits use replace: true
	 * to avoid polluting the browser history during continuous interaction.
	 */
	autoCommitDebounceMs?: number;
};

export type UseStagedSearchReturn< TSearch extends AnyObject > = {
	/**
	 * The current URL state.
	 */
	committed: TSearch;

	/**
	 * The optimistic snapshot for immediate UI.
	 */
	staged: TSearch;

	/**
	 * The effective state for rendering and data fetching.
	 */
	effective: TSearch;

	/**
	 * Whether the process is syncing.
	 */
	isSyncing: boolean;

	/**
	 * Whether the staged state differs from the committed state.
	 */
	isDirty: boolean;

	/**
	 * Stage a local patch without touching the URL.
	 */
	stage: ( patch: Partial< TSearch > ) => void;

	/**
	 * Commit all staged changes in a single atomic navigate().
	 */
	commit: ( opts?: { replace?: boolean } ) => void;

	/**
	 * Discard local changes and return to committed snapshot.
	 */
	revert: () => void;

	/**
	 * Cancel pending debounced commit.
	 */
	cancelAutoCommit: () => void;
};

function shallowEqual( a: AnyObject, b: AnyObject ) {
	if ( a === b ) {
		return true;
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

function mergeDefined< T extends AnyObject >( base: T, patch: Partial< T > ): T {
	const out: AnyObject = { ...base };
	for ( const key in patch ) {
		const val = patch[ key as keyof T ];
		if ( val !== undefined ) {
			out[ key ] = val as unknown;
		}
	}
	return out as T;
}

export function useStagedSearch< TSearch extends AnyObject, TFrom extends string >(
	opts: UseStagedSearchOptions< TFrom >
): UseStagedSearchReturn< TSearch > {
	const navigate = useNavigate( { from: opts.from } );
	const committed = useSearch( { from: opts.from } ) as TSearch;

	/*
	 * Stage the search params.
	 */
	const [ staged, setStaged ] = useState< TSearch >( committed );

	/*
	 * Track if the process is syncing.
	 */
	const [ isSyncing, setIsSyncing ] = useState( false ); // not used yet

	// Buffer for not-yet-committed changes.
	const bufferRef = useRef< Partial< TSearch > >( {} );

	// Debounce timer for auto-commit.
	const timerRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	/**
	 * Mirror URL -> staged.
	 * If URL changes (back/forward or external writes), align staged snapshot.
	 * Also clear syncing flag after the router applies the new committed state.
	 */
	useEffect( () => {
		setStaged( committed );
		bufferRef.current = {};
		if ( isSyncing ) {
			setIsSyncing( false );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ committed ] );

	/**
	 * Cancel pending debounced auto-commit.
	 */
	const cancelAutoCommit = useCallback( () => {
		if ( timerRef.current ) {
			clearTimeout( timerRef.current );
			timerRef.current = null;
		}
	}, [] );

	/**
	 * Cleanup on unmount.
	 */
	useEffect( () => {
		return () => {
			cancelAutoCommit();
		};
	}, [ cancelAutoCommit ] );

	/**
	 * Stage a local patch without touching the URL immediately.
	 * If autoCommitDebounceMs is set, schedule a debounced replace-commit.
	 */
	const stage = useCallback(
		( patch: Partial< TSearch > ) => {
			setStaged( prev => ( { ...prev, ...patch } ) );
			bufferRef.current = { ...bufferRef.current, ...patch };

			if ( typeof opts.autoCommitDebounceMs === 'number' ) {
				cancelAutoCommit();
				timerRef.current = setTimeout( () => {
					navigate( {
						replace: true, // do not pollute history while interacting
						viewTransition: false,
						search: prev => ( {
							...prev,
							...( bufferRef.current as Partial< TSearch > ),
						} ),
					} );
					timerRef.current = null;
				}, opts.autoCommitDebounceMs );
			}
		},
		[ navigate, opts.autoCommitDebounceMs, cancelAutoCommit ]
	);

	/**
	 * Commit all staged changes in a single atomic navigate().
	 * - No `to`: keep the current route (prevents heavy remounts).
	 * - Default `replace` to false so history is preserved on explicit commits.
	 * - Cancels any pending debounced commit.
	 */
	const commit = useCallback(
		( commitOpts?: { replace?: boolean } ) => {
			const patch = bufferRef.current;
			const hasPatch = patch && Object.keys( patch ).length > 0;

			// Cancel any pending debounced replace-commit
			cancelAutoCommit();

			// If buffer is empty but staged differs from committed, compute a minimal diff
			let diff: Partial< TSearch > | null = null;
			if ( ! hasPatch ) {
				const merged = {
					...( committed as AnyObject ),
					...( staged as AnyObject ),
				} as TSearch;

				if ( ! shallowEqual( merged as AnyObject, committed as AnyObject ) ) {
					diff = {};
					for ( const key in merged ) {
						// eslint-disable-next-line no-prototype-builtins
						if ( ( committed as AnyObject ).hasOwnProperty( key ) ) {
							if ( ( committed as AnyObject )[ key ] !== ( staged as AnyObject )[ key ] ) {
								( diff as AnyObject )[ key ] = ( staged as AnyObject )[ key ];
							}
						} else {
							( diff as AnyObject )[ key ] = ( staged as AnyObject )[ key ];
						}
					}
				}
			}

			const finalPatch = hasPatch ? ( patch as Partial< TSearch > ) : diff;

			if ( ! finalPatch || Object.keys( finalPatch ).length === 0 ) {
				return;
			}

			setIsSyncing( true );

			navigate( {
				replace: commitOpts?.replace ?? false, // explicit commits push into history
				viewTransition: false,
				search: prev => ( {
					...prev,
					...( finalPatch as Partial< TSearch > ),
				} ),
			} );

			// isSyncing is flipped off by the committed->staged mirror effect.
		},
		[ navigate, committed, staged, cancelAutoCommit ]
	);

	/**
	 * Discard local changes and return to committed snapshot.
	 */
	const revert = useCallback( () => {
		cancelAutoCommit();
		bufferRef.current = {};
		setStaged( committed );
	}, [ committed, cancelAutoCommit ] );

	/**
	 * Effective = committed merged with defined staged keys.
	 * Use this as the single source for rendering and data fetching.
	 */
	const effective = useMemo(
		() => mergeDefined( committed, staged ),
		[ committed, staged ]
	) as TSearch;

	/*
	 * Dirty if there is a buffer or staged differs from committed.
	 */
	const isDirty =
		Object.keys( bufferRef.current ).length > 0 &&
		! shallowEqual( staged as AnyObject, committed as AnyObject );

	return {
		committed,
		staged,
		effective,
		isSyncing,
		isDirty,
		stage,
		commit,
		revert,
		cancelAutoCommit,
	};
}
