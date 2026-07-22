import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from '@wordpress/element';
import { isJobInProgress, useImportJobs } from './use-import-jobs';

/**
 * Refreshes the subscribers list when a running import finishes.
 *
 * Adding subscribers starts an async WP.com import job. The add mutation invalidates the list
 * immediately, but the job usually hasn't processed the emails yet, so that first refetch returns
 * the pre-import list — and the "Add subscribers" modal closes right after submitting, which would
 * otherwise stop the import-jobs poll before the job lands. This watcher keeps that poll alive at
 * the dashboard level and invalidates the `subscribers` cache on the in-progress → done transition,
 * so freshly imported subscribers appear without a manual page reload. Mount once, near the top of
 * the subscribers dashboard.
 */
export function useImportCompletionRefresh(): void {
	const queryClient = useQueryClient();
	// Always enabled so the poll outlives the Add Subscribers modal (which mounts its own
	// `useImportJobs( isOpen )` — React Query dedupes both to a single query by key). The query only
	// polls the network while a job is actually in progress, so an idle dashboard makes one request.
	const { data } = useImportJobs( true );
	const wasInProgress = useRef( false );

	const inProgress = ( data ?? [] ).some( isJobInProgress );

	useEffect( () => {
		// Falling edge only: a job we saw running is no longer running. Invalidating on mount or
		// while still running would refetch needlessly (and the mutation already invalidates once
		// up front for imports fast enough to land on the first refetch).
		if ( wasInProgress.current && ! inProgress ) {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
		}
		wasInProgress.current = inProgress;
	}, [ inProgress, queryClient ] );
}
