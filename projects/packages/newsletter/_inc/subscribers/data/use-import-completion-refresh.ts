import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { toFiniteNumber } from '../lib/subscriber-helpers';
import { IMPORT_IN_PROGRESS_NOTICE_ID, isJobInProgress, useImportJobs } from './use-import-jobs';
import type { ImportJob } from './types';

type OutcomeNotice = { status: 'success' | 'error'; message: string };

/**
 * Map a finished import job to the snackbar it should show, or null when it shouldn't show one
 * (e.g. a user-cancelled reset). WP.com returns no human-readable failure reason on the job — only
 * outcome counts — so the copy is built from those counts and points at the import confirmation
 * email for the per-address detail. Note that "already subscribed" is a successful no-op on WP.com's
 * side (status `imported`, not `failed`), so it gets its own success message rather than an error.
 *
 * @param job - The import job that just reached a terminal state.
 * @return The notice to show, or null for no notice.
 */
export function describeImportOutcome( job: ImportJob ): OutcomeNotice | null {
	if ( job.status === 'failed' ) {
		return {
			status: 'error',
			message: __(
				'We couldn’t import your subscribers. Check your import confirmation email for details, then try again.',
				'jetpack-newsletter'
			),
		};
	}

	// Only `imported` carries a reportable outcome; `cancelled` (and any unexpected terminal state)
	// is silent.
	if ( job.status !== 'imported' ) {
		return null;
	}

	const subscribed = toFiniteNumber( job.subscribed_count ) ?? 0;
	const already = toFiniteNumber( job.already_subscribed_count ) ?? 0;
	const failed = toFiniteNumber( job.failed_subscribed_count ) ?? 0;

	if ( failed > 0 ) {
		// Some addresses were rejected (bounced, blocked, invalid). Most succeeded, so keep it a
		// success notice but surface the shortfall. The trailing clause is noun-free
		// ("%2$d couldn't be added") so it reads correctly for any count — a single _n can only
		// pluralize on one number, and that one is the imported count.
		//
		// This branch intentionally takes precedence over the already-subscribed cases below: a
		// batch that is partly rejected AND partly already-subscribed reports only the rejections,
		// since "couldn't be added" is the actionable signal (points at the confirmation email) and
		// already-subscribed is a benign no-op. The copy never claims a total, so omitting the
		// duplicate count reads as incomplete, not wrong — and a three-count snackbar would be worse.
		return {
			status: 'success',
			message: sprintf(
				// translators: %1$d: subscribers imported. %2$d: email addresses that couldn't be added.
				_n(
					'Imported %1$d subscriber. %2$d couldn’t be added — check your import confirmation email for details.',
					'Imported %1$d subscribers. %2$d couldn’t be added — check your import confirmation email for details.',
					subscribed,
					'jetpack-newsletter'
				),
				subscribed,
				failed
			),
		};
	}

	if ( subscribed > 0 && already > 0 ) {
		// Mixed batch: some new, some already on the list. Already-subscribed isn't a failure, so
		// this stays a success — it just also accounts for the skipped duplicates. The trailing
		// clause is verb-free ("%2$d already subscribed") so it reads correctly for any count, since
		// a single _n can only pluralize on one number.
		return {
			status: 'success',
			message: sprintf(
				// translators: %1$d: subscribers imported. %2$d: email addresses already subscribed.
				_n(
					'%1$d subscriber imported. %2$d already subscribed.',
					'%1$d subscribers imported. %2$d already subscribed.',
					subscribed,
					'jetpack-newsletter'
				),
				subscribed,
				already
			),
		};
	}

	if ( subscribed > 0 ) {
		return {
			status: 'success',
			message: sprintf(
				// translators: %d: number of subscribers imported.
				_n(
					'%d subscriber imported.',
					'%d subscribers imported.',
					subscribed,
					'jetpack-newsletter'
				),
				subscribed
			),
		};
	}

	if ( already > 0 ) {
		return {
			status: 'success',
			message: sprintf(
				// translators: %d: number of email addresses that were already subscribed.
				_n(
					'%d email address is already subscribed.',
					'%d email addresses are already subscribed.',
					already,
					'jetpack-newsletter'
				),
				already
			),
		};
	}

	return {
		status: 'success',
		message: __( 'Your subscribers have been imported.', 'jetpack-newsletter' ),
	};
}

/**
 * Refreshes the subscribers list when an import finishes, and resolves the "Importing…" snackbar
 * into a final status.
 *
 * Adding subscribers starts an async WP.com import job. The add mutation invalidates the list
 * immediately, but the job usually hasn't processed the emails yet, so that first refetch returns
 * the pre-import list — and the "Add subscribers" modal closes right after submitting, which would
 * otherwise stop the import-jobs poll before the job lands. This watcher keeps that poll alive at
 * the dashboard level, and announces each import as it reaches a terminal state: it refreshes the
 * `subscribers` cache (so imported subscribers appear without a manual reload) and swaps the stale
 * "Importing…" notice for a success / failure snackbar.
 *
 * Announcements are keyed by job id, not by watching for an in-progress → done transition — a small
 * or already-subscribed import can finish before any poll observes it running, and id-based
 * detection still catches those. Jobs already finished when the dashboard loads are recorded as
 * "already announced" so old imports aren't re-announced on every visit. Mount once, near the top of
 * the subscribers dashboard.
 *
 * @param enabled - Whether to run at all. Gate this on the subscribers feature being usable by this
 *                visitor (connected + feature enabled) AND the Subscribers tab being active: the
 *                dashboard shell mounts on every Newsletter page load — including the Settings tab,
 *                connection-gated users, and Settings-only sites — and without this gate each of
 *                those would poll the WP.com import endpoint (a 401/403 + retries for unconnected
 *                users). An import started on the Subscribers tab keeps polling once the modal
 *                closes (the user stays on the tab); if they leave for Settings mid-import it
 *                resolves when they return — the list only matters on the Subscribers tab anyway.
 */
export function useImportCompletionRefresh( enabled: boolean ): void {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice, removeNotice } = useDispatch( noticesStore );
	// Enabled only when the visitor can actually import; see the `enabled` param note. The query
	// outlives the Add Subscribers modal (which mounts its own `useImportJobs( isOpen )` — React
	// Query dedupes both to a single query by key), and only polls the network while a job is
	// actually in progress, so an idle dashboard makes one request.
	const { data } = useImportJobs( enabled );

	const announced = useRef< Set< number > >( new Set() );
	const seeded = useRef( false );

	const jobs = useMemo( () => data ?? [], [ data ] );

	useEffect( () => {
		// Wait for the first real payload before seeding — `undefined` is the initial loading state.
		if ( data === undefined ) {
			return;
		}

		// Seed once: anything already finished when the dashboard loaded predates this session, so
		// mark it announced and don't surface it. Jobs still running at load time are left unseeded
		// so we announce them when they finish.
		if ( ! seeded.current ) {
			seeded.current = true;
			for ( const job of jobs ) {
				if ( ! isJobInProgress( job ) ) {
					announced.current.add( job.id );
				}
			}
			return;
		}

		// One import runs per site at a time, so the newest job is the one to report. Announce it
		// once it reaches a terminal state we haven't reported yet.
		const newest = jobs[ 0 ];
		if ( ! newest || isJobInProgress( newest ) || announced.current.has( newest.id ) ) {
			return;
		}
		announced.current.add( newest.id );

		queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
		removeNotice( IMPORT_IN_PROGRESS_NOTICE_ID );

		const outcome = describeImportOutcome( newest );
		if ( outcome?.status === 'success' ) {
			createSuccessNotice( outcome.message, { type: 'snackbar' } );
		} else if ( outcome?.status === 'error' ) {
			createErrorNotice( outcome.message, { type: 'snackbar' } );
		}
	}, [ data, jobs, queryClient, createSuccessNotice, createErrorNotice, removeNotice ] );
}
