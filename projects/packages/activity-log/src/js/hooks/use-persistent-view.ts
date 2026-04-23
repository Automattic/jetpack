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
import { useCallback, useMemo, useState } from 'react';
import type { View } from '@wordpress/dataviews';

const STORAGE_KEY = 'jetpack-activity-log:view';

const readPersistedView = (): View | null => {
	if ( typeof window === 'undefined' ) {
		return null;
	}
	try {
		const raw = window.localStorage.getItem( STORAGE_KEY );
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
			window.localStorage.removeItem( STORAGE_KEY );
		} else {
			window.localStorage.setItem( STORAGE_KEY, JSON.stringify( view ) );
		}
	} catch {
		// Quota exceeded or localStorage disabled — drop silently.
	}
};

const stripTransient = ( v: View ): View => {
	const next = { ...v };
	delete next.page;
	delete next.search;
	if ( ! next.filters?.length ) {
		delete next.filters;
	}
	return next;
};

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
		return persisted ?? defaultView;
	} );

	const setView = useCallback(
		( next: View ) => {
			setViewState( next );

			// Persist only if the stripped view differs from the stripped
			// default — otherwise clear the entry so a "back to default"
			// session doesn't leave a redundant row in localStorage.
			const stripped = stripTransient( next );
			if ( fastDeepEqual( stripped, stripTransient( defaultView ) ) ) {
				writePersistedView( null );
			} else {
				writePersistedView( stripped );
			}
		},
		[ defaultView ]
	);

	const resetView = useCallback( () => {
		setViewState( defaultView );
		writePersistedView( null );
	}, [ defaultView ] );

	const isViewModified = useMemo(
		() => ! fastDeepEqual( stripTransient( view ), stripTransient( defaultView ) ),
		[ view, defaultView ]
	);

	return { view, setView, resetView, isViewModified };
}
