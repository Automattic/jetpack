import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from '@wordpress/element';
import { recordTracksEvent } from '../lib/tracks';
import { fetchBulkRemoveStatus, fetchSubscribers, startBulkRemove } from './api';
import type {
	BulkRemoveJob,
	BulkRemoveJobStatus,
	BulkRemoveState,
	SubscribersFilter,
} from './types';

export const BULK_REMOVE_QUERY_KEY = [ 'subscribers-bulk-remove' ] as const;

const POLL_MS = 5000;

const ACTIVE_STATUSES: BulkRemoveJobStatus[] = [ 'queued', 'backing_up', 'removing', 'finishing' ];

/**
 * Whether a job is still working. A stalled job (no progress for an hour) counts as finished, so
 * the screen stops polling it and the header actions come back.
 *
 * @param job - Job, or null.
 * @return True while the job is queued, backing up, removing or finishing.
 */
export function isBulkRemoveActive( job: BulkRemoveJob | null | undefined ): boolean {
	return !! job && ACTIVE_STATUSES.includes( job.status ) && ! job.stalled;
}

/**
 * The current bulk removal, polled every 5 seconds while it runs. On load this picks up a
 * removal started earlier (or in another tab), so the progress notice comes back after a reload.
 * When a running job finishes, the subscriber list and details are refetched and `_finished` is
 * recorded.
 *
 * The same response says whether the site can start a removal. WP.com turns owner removal on per
 * site, and a response without `enabled` counts as off, so the remove actions stay hidden.
 *
 * @param enabled    - Whether to fetch at all (false off the Subscribers tab).
 * @param onFinished - Called once when a job this screen saw running finishes.
 * @return The job (null when the site has none), whether it is still running, and whether the
 * site can start a removal.
 */
export function useBulkRemoveStatus( enabled = true, onFinished?: ( job: BulkRemoveJob ) => void ) {
	const queryClient = useQueryClient();
	const query = useQuery< BulkRemoveState >( {
		queryKey: BULK_REMOVE_QUERY_KEY,
		queryFn: async () => {
			const response = await fetchBulkRemoveStatus();
			return { job: response.job ?? null, enabled: response.enabled === true };
		},
		enabled,
		refetchInterval: q => ( isBulkRemoveActive( q.state.data?.job ) ? POLL_MS : false ),
		// The shared client skips focus refetches; this one must catch a removal started in another tab.
		refetchOnWindowFocus: 'always',
	} );

	const job = query.data?.job ?? null;
	const isEnabled = query.data?.enabled === true;
	const isActive = isBulkRemoveActive( job );

	// Remember which job we saw running, so the finish is handled once, and not for a job that
	// was already done when the page loaded.
	const watched = useRef< number | null >( null );
	const onFinishedRef = useRef( onFinished );
	useEffect( () => {
		onFinishedRef.current = onFinished;
	}, [ onFinished ] );
	useEffect( () => {
		if ( ! job ) {
			return;
		}
		if ( isActive ) {
			watched.current = job.id;
			return;
		}
		if ( watched.current === job.id ) {
			watched.current = null;
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'subscriber-details' ] } );
			onFinishedRef.current?.( job );
			recordTracksEvent( 'jetpack_subscribers_bulk_remove_finished', {
				job_id: job.id,
				status: job.status,
				stalled: job.stalled ? 1 : 0,
				total: job.total,
				removed: job.removed,
				failed: job.failed,
			} );
		}
	}, [ job, isActive, queryClient ] );

	return { job, isActive, isEnabled, isLoading: query.isLoading };
}

export type BulkRemoveScope = 'all' | 'matching';

type StartVariables = {
	scope: BulkRemoveScope;
	filters: SubscribersFilter[];
	search: string;
	expectedCount: number;
};

/**
 * Start a bulk removal. On success the new job goes straight into the status cache, so the
 * progress notice shows at once and polling starts.
 *
 * @return React Query mutation handle.
 */
export function useStartBulkRemoveMutation() {
	const queryClient = useQueryClient();

	return useMutation< BulkRemoveJob | null, BulkRemoveError, StartVariables >( {
		mutationFn: async ( { scope, filters, search, expectedCount } ) => {
			const response = await startBulkRemove( {
				filters: scope === 'all' ? [ 'all' ] : filters,
				search: scope === 'all' ? '' : search,
				expectedCount,
			} );
			return response.job ?? null;
		},
		onSuccess: async job => {
			// A status response already in flight is older than this job, so it must not land after it.
			await queryClient.cancelQueries( { queryKey: BULK_REMOVE_QUERY_KEY } );
			// WP.com only starts a job when removal is on for the site.
			queryClient.setQueryData< BulkRemoveState >( BULK_REMOVE_QUERY_KEY, { job, enabled: true } );
		},
		onError: async error => {
			if ( error?.code !== 'bulk_remove_in_progress' ) {
				return;
			}
			// Another removal is running: show it, or fetch it when the error does not carry it.
			const runningJob = error.data?.job;
			if ( runningJob ) {
				await queryClient.cancelQueries( { queryKey: BULK_REMOVE_QUERY_KEY } );
				queryClient.setQueryData< BulkRemoveState >( BULK_REMOVE_QUERY_KEY, old => ( {
					job: runningJob,
					enabled: old?.enabled ?? false,
				} ) );
			} else {
				queryClient.invalidateQueries( { queryKey: BULK_REMOVE_QUERY_KEY } );
			}
		},
	} );
}

/**
 * The error `apiFetch` rejects with when the proxy passes on a WP.com error.
 */
export type BulkRemoveError = {
	code?: string;
	message?: string;
	data?: {
		status?: number;
		count?: number;
		job?: BulkRemoveJob;
	};
};

type Counts = {
	total: number;
	paid: number;
};

/**
 * The counts the confirm dialog needs: how many subscribers in all and how many paid, either for
 * the whole list or for the current filters and search. Each is a one-row list request, which
 * returns the total without loading the list.
 *
 * @param params         - What to count.
 * @param params.filters - Filters, or `['all']`.
 * @param params.search  - Search term, or an empty string.
 * @param params.enabled - Fetch only while the dialog is open.
 * @return Total and paid counts, or undefined while loading.
 */
export function useBulkRemoveCounts( {
	filters,
	search,
	enabled,
}: {
	filters: SubscribersFilter[];
	search: string;
	enabled: boolean;
} ) {
	// Sorted, so the same filters in another order share one cache entry.
	const base = filters.filter( filter => filter !== 'all' ).sort();

	return useQuery< Counts, Error >( {
		queryKey: [ 'subscribers', 'bulk-remove-counts', base, search ],
		enabled,
		staleTime: 0,
		queryFn: async () => {
			const params = {
				page: 1,
				perPage: 1,
				sort: 'date_subscribed' as const,
				sortOrder: 'desc' as const,
				search,
			};
			const [ all, paid ] = await Promise.all( [
				fetchSubscribers( { ...params, filters: base.length ? base : [ 'all' ] } ),
				// The paid filter combines with the others (AND), so this counts the paid matches.
				base.includes( 'paid' )
					? null
					: fetchSubscribers( { ...params, filters: [ ...base, 'paid' ] } ),
			] );
			return { total: all.total, paid: paid ? paid.total : all.total };
		},
	} );
}
