import { useQuery } from '@tanstack/react-query';
import { fetchImportJobs } from './api';
import type { ImportJob } from './types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ACTIVE_POLL_INTERVAL_MS = 5000;

/**
 * Stable id for the "Importing…" snackbar. The add-subscribers mutation creates the notice under
 * this id when it kicks off an import; `useImportCompletionRefresh` removes it (and replaces it with
 * a success / failure notice) once the job reaches a terminal state, so the message tracks the
 * import instead of the notice system's auto-dismiss timer.
 */
export const IMPORT_IN_PROGRESS_NOTICE_ID = 'jetpack-newsletter/subscribers-import-in-progress';

/**
 * Whether an import job is still running. WP.com refuses to start a new import while any job is
 * in one of these states. `awaiting` is the gap between "enqueued" and "picked up by a worker" —
 * still in-flight, so it must count as in progress or a poll landing mid-queue would read the job
 * as finished.
 *
 * @param job - Import job.
 * @return Whether the job is pending, awaiting, or importing.
 */
export function isJobInProgress( job: ImportJob ): boolean {
	return job.status === 'pending' || job.status === 'awaiting' || job.status === 'importing';
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
