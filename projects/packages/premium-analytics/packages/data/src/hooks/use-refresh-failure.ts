/**
 * External dependencies
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
/**
 * Internal dependencies
 */
import { shouldRetryApiError } from '../utils/api-error';
import type { QueryCache } from '@tanstack/react-query';

export interface RefreshFailure {
	/** A refresh failed while the data it was replacing is still on screen. */
	hasStaleData: boolean;
	/** When the oldest data still on screen was last fetched, in epoch ms. */
	dataUpdatedAt?: number;
	/** False when every failure is deterministic (auth, permissions), so retrying cannot help. */
	canRetry: boolean;
	/** Refetch the failed queries. */
	retry: () => void;
}

type Snapshot = Omit< RefreshFailure, 'retry' >;

const NO_FAILURE: Snapshot = { hasStaleData: false, canRetry: false };

function readCache( cache: QueryCache ): Snapshot {
	let dataUpdatedAt: number | undefined;
	let canRetry = false;

	for ( const query of cache.getAll() ) {
		// Unobserved entries are cached leftovers nobody is reading; only what a
		// mounted widget still shows can look like fresh data.
		if ( query.getObserversCount() === 0 ) {
			continue;
		}

		const state = query.state;
		// Retained data is what separates a failed refresh from a failed first
		// load — the latter is the widget's own error state to render.
		if ( state.status !== 'error' || state.data === undefined ) {
			continue;
		}

		// The oldest fetch is the honest one to name: it is the staleness the
		// reader is actually looking at somewhere on the page.
		dataUpdatedAt =
			dataUpdatedAt === undefined
				? state.dataUpdatedAt
				: Math.min( dataUpdatedAt, state.dataUpdatedAt );
		// The auto-retry policy answers the same question as the Retry button —
		// can fetching this again plausibly succeed? — so it decides both.
		canRetry = canRetry || shouldRetryApiError( 0, state.error );
	}

	return dataUpdatedAt === undefined ? NO_FAILURE : { hasStaleData: true, dataUpdatedAt, canRetry };
}

function isSameSnapshot( a: Snapshot, b: Snapshot ): boolean {
	return (
		a.hasStaleData === b.hasStaleData &&
		a.dataUpdatedAt === b.dataUpdatedAt &&
		a.canRetry === b.canRetry
	);
}

function createStore( cache: QueryCache ) {
	let snapshot = readCache( cache );

	return {
		subscribe: ( onStoreChange: () => void ) => cache.subscribe( onStoreChange ),
		// Recomputed on every read, but returns the previous object while the
		// values match, so `useSyncExternalStore` can bail out of the render.
		getSnapshot: () => {
			const next = readCache( cache );
			if ( ! isSameSnapshot( next, snapshot ) ) {
				snapshot = next;
			}
			return snapshot;
		},
	};
}

/**
 * Report whether any mounted query failed to refresh while still holding the
 * data it was refreshing, which widgets render as if it were current.
 */
export function useRefreshFailure(): RefreshFailure {
	const queryClient = useQueryClient();
	const store = useMemo( () => createStore( queryClient.getQueryCache() ), [ queryClient ] );
	const snapshot = useSyncExternalStore( store.subscribe, store.getSnapshot, store.getSnapshot );

	const retry = useCallback( () => {
		void queryClient.refetchQueries( {
			type: 'active',
			predicate: query => query.state.status === 'error',
		} );
	}, [ queryClient ] );

	return useMemo( () => ( { ...snapshot, retry } ), [ snapshot, retry ] );
}
