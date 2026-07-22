import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { toFiniteNumber } from '../lib/subscriber-helpers';
import { IMPORT_IN_PROGRESS_NOTICE_ID, isJobInProgress, useImportJobs } from './use-import-jobs';

/**
 * Refreshes the subscribers list when a running import finishes, and resolves the "Importing…"
 * snackbar into a final status.
 *
 * Adding subscribers starts an async WP.com import job. The add mutation invalidates the list
 * immediately, but the job usually hasn't processed the emails yet, so that first refetch returns
 * the pre-import list — and the "Add subscribers" modal closes right after submitting, which would
 * otherwise stop the import-jobs poll before the job lands. This watcher keeps that poll alive at
 * the dashboard level and, on the in-progress → done transition, invalidates the `subscribers`
 * cache (so freshly imported subscribers appear without a manual reload) and swaps the stale
 * "Importing…" notice for a success / failure snackbar.
 *
 * The completion snackbar is built from the job's outcome counts because WP.com does not return a
 * human-readable failure reason on the import job — the per-email reasons only reach the user via
 * the import confirmation email — so counts (imported vs. couldn't-be-added) are the most specific
 * feedback the dashboard can give. Mount once, near the top of the subscribers dashboard.
 */
export function useImportCompletionRefresh(): void {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice, removeNotice } = useDispatch( noticesStore );
	// Always enabled so the poll outlives the Add Subscribers modal (which mounts its own
	// `useImportJobs( isOpen )` — React Query dedupes both to a single query by key). The query only
	// polls the network while a job is actually in progress, so an idle dashboard makes one request.
	const { data } = useImportJobs( true );
	const wasInProgress = useRef( false );

	// Newest first, so `jobs[ 0 ]` is the import that just finished on the falling edge. Memoized so
	// the effect below doesn't re-run on every render off a fresh `[]` fallback.
	const jobs = useMemo( () => data ?? [], [ data ] );
	const inProgress = jobs.some( isJobInProgress );

	useEffect( () => {
		// Falling edge only: a job we saw running is no longer running. Invalidating on mount or
		// while still running would refetch needlessly (and the mutation already invalidates once
		// up front for imports fast enough to land on the first refetch).
		if ( wasInProgress.current && ! inProgress ) {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );

			// Replace the fire-and-forget "Importing…" snackbar with the real outcome. `cancelled`
			// is a user-initiated reset, not a failure, so it gets no notice.
			removeNotice( IMPORT_IN_PROGRESS_NOTICE_ID );
			const finished = jobs[ 0 ];
			const status = finished?.status;
			const subscribed = toFiniteNumber( finished?.subscribed_count ) ?? 0;
			const failed = toFiniteNumber( finished?.failed_subscribed_count ) ?? 0;

			if ( status === 'imported' && failed > 0 ) {
				// Partial import — most succeeded, so keep it a success notice, but surface the
				// shortfall. The job carries only the count, not which addresses or why, so point
				// at the confirmation email.
				createSuccessNotice(
					sprintf(
						// translators: %1$d: subscribers imported. %2$d: addresses that couldn't be added.
						_n(
							'Imported %1$d subscriber. %2$d address couldn’t be added — check your import confirmation email for details.',
							'Imported %1$d subscribers. %2$d addresses couldn’t be added — check your import confirmation email for details.',
							subscribed,
							'jetpack-newsletter'
						),
						subscribed,
						failed
					),
					{ type: 'snackbar' }
				);
			} else if ( status === 'imported' ) {
				createSuccessNotice(
					subscribed > 0
						? sprintf(
								// translators: %d: number of subscribers imported.
								_n(
									'%d subscriber imported.',
									'%d subscribers imported.',
									subscribed,
									'jetpack-newsletter'
								),
								subscribed
						  )
						: __( 'Your subscribers have been imported.', 'jetpack-newsletter' ),
					{ type: 'snackbar' }
				);
			} else if ( status === 'failed' ) {
				createErrorNotice(
					__(
						'We couldn’t import your subscribers. Check your import confirmation email for details, then try again.',
						'jetpack-newsletter'
					),
					{ type: 'snackbar' }
				);
			}
		}
		wasInProgress.current = inProgress;
	}, [ inProgress, jobs, queryClient, createSuccessNotice, createErrorNotice, removeNotice ] );
}
