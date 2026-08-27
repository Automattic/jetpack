/**
 * External dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { useStagedValue } from '../use-staged-value';

type AnyObject = Record< string, unknown >;

export type UseStagedSearchOptions< TFrom extends string > = {
	/**
	 * The route the search params are bound to, e.g. `/`. Omit to read whichever
	 * route is matched — the way `WidgetRoot` resolves report params — so a
	 * widget can commit on any page that hosts it.
	 */
	from?: TFrom;

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

	cancelAutoCommit: () => void;
};

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

/**
 * `useStagedValue` bound to the URL: edits stage locally and land as one atomic
 * navigation, so widgets re-fetch on commit and Back/Forward stays smooth.
 *
 * @param opts - The route binding and the optional auto-commit debounce.
 * @return The committed, staged and effective snapshots, and their controls.
 */
export function useStagedSearch< TSearch extends AnyObject, TFrom extends string >(
	opts: UseStagedSearchOptions< TFrom >
): UseStagedSearchReturn< TSearch > {
	const navigate = useNavigate( opts.from === undefined ? {} : { from: opts.from } );

	/*
	 * TanStack types the strict and loose forms as exclusive shapes keyed on a
	 * generic, so a runtime choice between them cannot satisfy either on its own;
	 * the widened parameter type admits both.
	 */
	const searchOptions = (
		opts.from === undefined ? { strict: false } : { from: opts.from }
	) as Parameters< typeof useSearch >[ 0 ];
	const committed = useSearch( searchOptions ) as TSearch;

	const [ isSyncing, setIsSyncing ] = useState( false ); // not used yet

	// Debounce timer for auto-commit.
	const timerRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	// Cleared once the router has applied the new committed state.
	useEffect( () => {
		setIsSyncing( false );
	}, [ committed ] );

	const cancelAutoCommit = useCallback( () => {
		if ( timerRef.current ) {
			clearTimeout( timerRef.current );
			timerRef.current = null;
		}
	}, [] );

	useEffect( () => {
		return () => {
			cancelAutoCommit();
		};
	}, [ cancelAutoCommit ] );

	/*
	 * Writes the patch rather than the whole draft, and passes no `to`, so a
	 * commit keeps the current route and every search param this hook does not
	 * own — and avoids the remount a route change would cost.
	 */
	const writeToSearch = useCallback(
		( _staged: TSearch, patch: Partial< TSearch >, commitOpts?: { replace?: boolean } ) => {
			cancelAutoCommit();
			setIsSyncing( true );

			navigate( {
				replace: commitOpts?.replace ?? false, // explicit commits push into history
				viewTransition: false,
				search: prev => ( { ...prev, ...patch } ),
			} );
		},
		[ cancelAutoCommit, navigate ]
	);

	const {
		staged,
		isDirty,
		stage: stageValue,
		commit,
		revert: revertValue,
	} = useStagedValue< TSearch, { replace?: boolean } >( committed, writeToSearch );

	const stage = useCallback(
		( patch: Partial< TSearch > ) => {
			stageValue( patch );

			if ( typeof opts.autoCommitDebounceMs === 'number' ) {
				cancelAutoCommit();
				timerRef.current = setTimeout( () => {
					timerRef.current = null;
					commit( { replace: true } ); // do not pollute history while interacting
				}, opts.autoCommitDebounceMs );
			}
		},
		[ stageValue, commit, cancelAutoCommit, opts.autoCommitDebounceMs ]
	);

	const revert = useCallback( () => {
		cancelAutoCommit();
		revertValue();
	}, [ cancelAutoCommit, revertValue ] );

	/**
	 * Effective = committed merged with defined staged keys.
	 * Use this as the single source for rendering and data fetching.
	 */
	const effective = useMemo(
		() => mergeDefined( committed, staged ),
		[ committed, staged ]
	) as TSearch;

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
