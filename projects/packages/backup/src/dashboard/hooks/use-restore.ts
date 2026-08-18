import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { fetchRecentRestores, fetchRestoreStatus, initiateRestore } from '../data/api/restore';
import { keys } from '../data/query-client';
import type { RestoreStatus } from '../data/api/restore';
import type { RestoreItems, RestoreState } from '../types/restore';

type Result = {
	state: RestoreState;
	submit: ( items: RestoreItems ) => void;
	reset: () => void;
};

const POLL_INTERVAL_MS = 5000;

/**
 * How long the screen will go without a recognisable sign of life before
 * it admits it has lost track of the restore.
 *
 * Measured from the last `running` reading, not from the start, so this
 * does not cap the restore itself: a two-hour restore of a large site
 * keeps polling for as long as it keeps reporting progress. It caps only
 * silence.
 *
 * Something has to cap it. The state machine this replaces stopped
 * polling on any status it did not recognise — and it recognised none of
 * the real ones — so the progress bar froze at its first reading with no
 * timeout and no way out.
 */
const QUIET_TIMEOUT_MS = 5 * 60 * 1000;

/** Statuses that mean the restore is still going, or might be. */
const LIVE_STATUSES: RestoreStatus[] = [ 'queued', 'running', 'unknown' ];

/**
 * Drives the modernized Restore screen.
 *
 * Submit starts the restore, then a polled status query advances
 * idle → submitting → queued → progress → one of the terminal states.
 *
 * Two things make this more than a request and a poll.
 *
 * WordPress.com may accept a restore without returning an id for it —
 * VaultPress does not reliably echo one, and the documented response for
 * the underlying call is only `{ ok, error }`. That is a success, not a
 * failure, so when it happens the id is recovered by matching the rewind
 * id we submitted against the restores collection. Until it is found the
 * screen sits in `queued`, which is the truth: the restore is under way
 * and we cannot yet say how far along.
 *
 * And the poll fails safe in the direction that matters. An unrecognised
 * status keeps the poll alive under a silence timeout rather than
 * stopping it, because the failure this replaces was a bar frozen
 * forever at its first reading.
 *
 * @param rewindId - The backup's rewind id, in full.
 * @return state + submit + reset.
 */
export function useRestore( rewindId: string ): Result {
	const [ submittedId, setSubmittedId ] = useState< number | null >( null );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );
	// Set once the restore is accepted, whether or not it came with an id.
	// Distinguishes "queued, id unknown" from "not started".
	const [ startedRewindId, setStartedRewindId ] = useState< string | null >( null );
	// When we last had a recognisable sign of life. A ref because it is a
	// deadline, not something the UI renders — see QUIET_TIMEOUT_MS.
	const lastAliveAt = useRef< number | null >( null );

	// Destructure to keep stable references for useCallback deps —
	// passing the whole `mutation` object trips
	// @tanstack/query/no-unstable-deps.
	const {
		mutate: kickOff,
		reset: resetMutation,
		isPending,
	} = useMutation( {
		mutationFn: ( items: RestoreItems ) => initiateRestore( rewindId, items ),
		onSuccess: result => {
			setErrorMessage( null );
			setStartedRewindId( result.rewind_id || rewindId );
			lastAliveAt.current = Date.now();
			if ( result.id !== null ) {
				setSubmittedId( result.id );
			}
		},
		onError: ( err: Error ) => {
			setErrorMessage( err.message );
		},
	} );

	// Recovery for the no-id case. The query stays a plain read of the
	// collection; the matching is derived below, so nothing here depends
	// on state that would have to be mirrored into the query key.
	const needsId = startedRewindId !== null && submittedId === null;
	const restoresQuery = useQuery( {
		queryKey: keys.recentRestores(),
		queryFn: fetchRecentRestores,
		enabled: needsId,
		refetchInterval: needsId ? POLL_INTERVAL_MS : false,
	} );

	const recoveredId = useMemo( () => {
		if ( ! needsId ) {
			return null;
		}
		const match = restoresQuery.data?.find( row => row.rewind_id === startedRewindId );
		return match ? match.restore_id : null;
	}, [ needsId, restoresQuery.data, startedRewindId ] );

	const restoreId = submittedId ?? recoveredId;

	// Always-defined query key so @tanstack/query/exhaustive-deps stays
	// happy; the `enabled` flag keeps the placeholder query from firing.
	const effectiveRestoreId = restoreId ?? -1;
	const statusQuery = useQuery( {
		queryKey: keys.restoreStatus( effectiveRestoreId ),
		queryFn: () => fetchRestoreStatus( effectiveRestoreId ),
		enabled: restoreId !== null,
		refetchInterval: query => {
			const status = query.state.data?.status;
			const isLive = status === undefined || LIVE_STATUSES.includes( status );
			if ( ! isLive ) {
				return false;
			}
			// Keep asking through anything unrecognised — stopping there is
			// what froze this before — but not forever.
			if ( lastAliveAt.current !== null && Date.now() - lastAliveAt.current > QUIET_TIMEOUT_MS ) {
				return false;
			}
			return POLL_INTERVAL_MS;
		},
	} );

	// A running restore is the only unambiguous sign of life. Recorded in
	// an effect rather than during render so the render stays pure.
	const observedStatus = statusQuery.data?.status;
	useEffect( () => {
		if ( observedStatus === 'running' ) {
			lastAliveAt.current = Date.now();
		}
	}, [ observedStatus, statusQuery.dataUpdatedAt ] );

	const submit = useCallback( ( items: RestoreItems ) => kickOff( items ), [ kickOff ] );
	const reset = useCallback( () => {
		setSubmittedId( null );
		setErrorMessage( null );
		setStartedRewindId( null );
		lastAliveAt.current = null;
		resetMutation();
	}, [ resetMutation ] );

	return { state: deriveState(), submit, reset };

	/**
	 * Collapse the queries into the one thing the screen renders.
	 *
	 * @return The current phase.
	 */
	function deriveState(): RestoreState {
		if ( errorMessage ) {
			return { phase: 'error', message: errorMessage };
		}
		if ( isPending ) {
			return { phase: 'submitting' };
		}
		if ( startedRewindId === null ) {
			return { phase: 'idle' };
		}
		// A network failure mid-poll, surfaced rather than left sitting at
		// the last known percent with no way out.
		if ( restoreId !== null && statusQuery.error ) {
			return {
				phase: 'error',
				message:
					statusQuery.error.message ||
					__( 'Lost connection while restoring.', 'jetpack-backup-pkg' ),
			};
		}

		const data = statusQuery.data;
		switch ( data?.status ) {
			case 'finished':
				return { phase: 'success' };
			case 'finished-with-errors':
				return { phase: 'success-with-errors', message: data.message };
			case 'failed':
			case 'aborted':
				// `error_code` is a machine identifier (e.g.
				// `checksum_mismatch`) — never surface it; fall through to
				// the translated generic when `message` is empty.
				return {
					phase: 'error',
					message: data.message || __( 'Restore failed.', 'jetpack-backup-pkg' ),
				};
			case 'running':
				return { phase: 'progress', percent: Math.round( data.progress ?? 0 ) };
			default:
				// `queued`, `unknown`, or nothing yet. All the same to the
				// reader: accepted, nothing to show. Unless it has been
				// that way long enough that we should stop implying
				// something is about to happen.
				if ( lastAliveAt.current !== null && Date.now() - lastAliveAt.current > QUIET_TIMEOUT_MS ) {
					return {
						phase: 'error',
						message: __(
							"We've lost track of this restore. It may still be running — you'll get an email when it finishes.",
							'jetpack-backup-pkg'
						),
					};
				}
				return { phase: 'queued' };
		}
	}
}
