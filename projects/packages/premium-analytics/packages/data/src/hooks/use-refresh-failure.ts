/**
 * External dependencies
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
/**
 * Internal dependencies
 */
import { isUserRetryableError } from '../utils/api-error';
import { isRefreshNoticeQuery } from './refresh-failure-scope';
import type { QueryCache } from '@tanstack/react-query';

type NoRefreshFailure = {
	hasStaleData: false;
};

type StaleDataRetained = {
	hasStaleData: true;
	/** When the oldest data still on screen was last fetched, in epoch ms. */
	dataUpdatedAt: number;
	/** False only when every failure on screen is deterministic for this session. */
	canRetry: boolean;
	isRetrying: boolean;
};

export type RefreshFailureSnapshot = NoRefreshFailure | StaleDataRetained;

export type RefreshFailure = RefreshFailureSnapshot & {
	/** Refetch the queries this snapshot counted, and only those. */
	retry: () => void;
};

const NO_FAILURE: NoRefreshFailure = { hasStaleData: false };

function readCache( cache: QueryCache ): RefreshFailureSnapshot {
	let dataUpdatedAt: number | undefined;
	let canRetry = false;
	let isRetrying = false;

	for ( const query of cache.getAll() ) {
		if ( ! isRefreshNoticeQuery( query ) ) {
			continue;
		}

		const state = query.state;
		// The oldest fetch is the honest one to name: it is the staleness the
		// reader is looking at somewhere on the page.
		dataUpdatedAt =
			dataUpdatedAt === undefined
				? state.dataUpdatedAt
				: Math.min( dataUpdatedAt, state.dataUpdatedAt );
		canRetry = canRetry || isUserRetryableError( state.error );
		isRetrying = isRetrying || state.fetchStatus === 'fetching';
	}

	return dataUpdatedAt === undefined
		? NO_FAILURE
		: { hasStaleData: true, dataUpdatedAt, canRetry, isRetrying };
}

function isSameSnapshot( a: RefreshFailureSnapshot, b: RefreshFailureSnapshot ): boolean {
	if ( ! a.hasStaleData || ! b.hasStaleData ) {
		return a.hasStaleData === b.hasStaleData;
	}

	return (
		a.dataUpdatedAt === b.dataUpdatedAt &&
		a.canRetry === b.canRetry &&
		a.isRetrying === b.isRetrying
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
 * Report whether a query the reader reads numbers from failed to refresh while
 * still holding the data it was refreshing, which widgets render as if it were
 * current.
 */
export function useRefreshFailure(): RefreshFailure {
	const queryClient = useQueryClient();
	const store = useMemo( () => createStore( queryClient.getQueryCache() ), [ queryClient ] );
	const snapshot = useSyncExternalStore( store.subscribe, store.getSnapshot, store.getSnapshot );

	const retry = useCallback( () => {
		void queryClient.refetchQueries( { predicate: isRefreshNoticeQuery } );
	}, [ queryClient ] );

	return useMemo( () => ( { ...snapshot, retry } ), [ snapshot, retry ] );
}
