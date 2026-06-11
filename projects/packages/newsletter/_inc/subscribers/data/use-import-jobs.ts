import { useQuery } from '@tanstack/react-query';
import { fetchImportJobs } from './api';
import type { ImportJob } from './types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ACTIVE_POLL_INTERVAL_MS = 5000;

/**
 * Whether an import job is still running. WP.com refuses to start a new import while any job is
 * in one of these states.
 *
 * @param job - Import job.
 * @return Whether the job is pending or importing.
 */
export function isJobInProgress( job: ImportJob ): boolean {
	return job.status === 'pending' || job.status === 'importing';
}

/**
 * Whether an in-progress job has been running long enough to be considered stuck — same
 * 24-hour threshold as Calypso's `useHasStaleImportJobs`. Stale jobs block new imports until
 * the user resets them.
 *
 * @param job - Import job.
 * @param now - Current timestamp in ms (injectable for tests).
 * @return Whether the job is stale.
 */
export function isJobStale( job: ImportJob, now: number = Date.now() ): boolean {
	if ( ! isJobInProgress( job ) || ! job.scheduled_at ) {
		return false;
	}
	return now - new Date( job.scheduled_at ).getTime() > DAY_IN_MS;
}

/**
 * Import-jobs query for the Add Subscribers modal. Polls while a job is in progress so the
 * "import in progress" notice clears itself when WP.com finishes the job; the key shares the
 * `[ 'subscribers' ]` prefix so starting an import (which invalidates that prefix) refetches it.
 *
 * @param enabled - Whether the query should run (modal open).
 * @return React-Query result with the jobs list, newest first.
 */
export function useImportJobs( enabled: boolean ) {
	return useQuery< ImportJob[], Error >( {
		queryKey: [ 'subscribers', 'import-jobs' ],
		queryFn: fetchImportJobs,
		enabled,
		refetchInterval: query =>
			query.state.data?.some( isJobInProgress ) ? ACTIVE_POLL_INTERVAL_MS : false,
	} );
}
