/**
 * Persistent DataViews view state for the Activity Log.
 *
 * Mirrors the behavior of Calypso's `usePersistentView`
 * (client/dashboard/app/hooks/use-persistent-view.ts): persist the
 * non-transient view config (fields, density, perPage, sort, layout),
 * not the transient bits (`page`, `search`, empty `filters`). Calypso
 * persists to WordPress.com user preferences; in a self-hosted Jetpack
 * plugin we don't have that API, so we back the store with
 * `localStorage` instead. The hook signature stays swappable: a future
 * move to a user-meta-backed store only touches this file.
 */
import fastDeepEqual from 'fast-deep-equal/es6';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { View } from '@wordpress/dataviews';

interface InitialStateShape {
	siteData?: { id?: number | string };
}

declare const JPACTIVITYLOG_INITIAL_STATE: InitialStateShape | undefined;

// Site-scope the storage key on the WPCOM blog ID seeded by Initial_State.
// Without this, an admin who manages multiple Jetpack-connected sites in the
// same browser would share a single view across all of them. Falls back to
// `default` when the global is absent (storybook/tests) or the id is unset.
const getStorageKey = (): string => {
	const state =
		typeof JPACTIVITYLOG_INITIAL_STATE !== 'undefined' ? JPACTIVITYLOG_INITIAL_STATE : undefined;
	const siteId = state?.siteData?.id;
	const scope = siteId !== undefined && siteId !== null && siteId !== '' ? siteId : 'default';
	return `jetpack-activity-log:view:${ scope }`;
};

const readPersistedView = (): View | null => {
	if ( typeof window === 'undefined' ) {
		return null;
	}
	try {
		const raw = window.localStorage.getItem( getStorageKey() );
		if ( ! raw ) {
			return null;
		}
		const parsed = JSON.parse( raw );
		return parsed && typeof parsed === 'object' ? ( parsed as View ) : null;
	} catch {
		return null;
	}
};

const writePersistedView = ( view: View | null ): void => {
	if ( typeof window === 'undefined' ) {
		return;
	}
	try {
		if ( view === null ) {
			window.localStorage.removeItem( getStorageKey() );
		} else {
			window.localStorage.setItem( getStorageKey(), JSON.stringify( view ) );
		}
	} catch {
		// Quota exceeded or localStorage disabled — drop silently.
	}
};

const stripTransient = ( v: View ): View => {
	const next = { ...v };
	delete next.page;
	delete next.search;
	// Filters count as transient too — a selected activity-type is
	// scoped to the current debugging session, not a long-lived
	// preference. (Previously only empty-array filters were dropped,
	// which meant a "Plugins" selection survived across reloads —
	// reported in review.)
	delete next.filters;
	return next;
};

// Narrow whitelist of the fields the user can actually edit from the
// settings cog (sort, order, properties, density, items-per-page, plus
// filters). Comparing the full view object instead can flip the
// "modified" bit when DataViews normalizes an unrelated internal field
// on mount; comparing only the signature avoids that false positive.
const viewSignature = ( v: View ) => ( {
	fields: v.fields,
	sort: v.sort,
	perPage: v.perPage,
	density: v.layout?.density,
	filters: v.filters?.length ? v.filters : undefined,
} );

const isMeaningfullyModified = ( current: View, base: View ): boolean =>
	! fastDeepEqual( viewSignature( current ), viewSignature( base ) );

/**
 * Hook that tracks a DataViews view and persists the non-transient
 * parts to localStorage.
 *
 * @param defaultView - The fallback view used when no persisted entry
 *                    exists. Also the reference point for `isViewModified` and the target
 *                    of `resetView`.
 * @return An object with the current `view`, a `setView` persistence-
 * aware setter, a `resetView` function, and the `isViewModified` flag
 * the `onReset` prop needs to decide whether to show the Reset view
 * button.
 */
export function usePersistentView( defaultView: View ): {
	view: View;
	setView: ( next: View ) => void;
	resetView: () => void;
	isViewModified: boolean;
} {
	const [ view, setViewState ] = useState< View >( () => {
		const persisted = readPersistedView();
		// Self-heal: if a previous session wrote a "not really modified"
		// view (e.g. because DataViews touched a layout subfield on mount
		// before we added the viewSignature whitelist), boot with the
		// default so Reset view stays disabled on load. The matching
		// localStorage cleanup runs in the effect below — keeping side
		// effects out of the lazy initializer so React 18 strict-mode's
		// double-invoke doesn't write twice.
		if ( persisted && ! isMeaningfullyModified( persisted, defaultView ) ) {
			return defaultView;
		}
		return persisted ?? defaultView;
	} );

	// One-shot mount cleanup for the self-heal case above.
	useEffect( () => {
		const persisted = readPersistedView();
		if ( persisted && ! isMeaningfullyModified( persisted, defaultView ) ) {
			writePersistedView( null );
		}
		// Mount-only — `defaultView` is a stable module-level constant
		// (DEFAULT_VIEW), so re-checking on identity changes would be
		// noise. Intentional empty deps.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const setView = useCallback(
		( next: View ) => {
			setViewState( next );

			// Persist only when the signature differs. We still write the
			// full stripped view (not just the signature) so future fields
			// restore correctly — the signature just gates whether we
			// persist at all.
			if ( isMeaningfullyModified( next, defaultView ) ) {
				writePersistedView( stripTransient( next ) );
			} else {
				writePersistedView( null );
			}
		},
		[ defaultView ]
	);

	const resetView = useCallback( () => {
		setViewState( defaultView );
		writePersistedView( null );
	}, [ defaultView ] );

	const isViewModified = useMemo(
		() => isMeaningfullyModified( view, defaultView ),
		[ view, defaultView ]
	);

	return { view, setView, resetView, isViewModified };
}
