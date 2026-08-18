import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { fetchRecentRestores, fetchRestoreStatus, initiateRestore } from '../data/api/restore';
import { keys } from '../data/query-client';
import type { RestoreStatus, RestoreStatusResponse } from '../data/api/restore';
import type { RestoreItems, RestoreState } from '../types/restore';

type Result = {
	state: RestoreState;
	submit: ( items: RestoreItems ) => void;
	reset: () => void;
};

/**
 * How often to ask, both for status and — while the id is unknown — for
 * the restores collection.
 *
 * Raised from the 1.5s the download flow uses. A restore is a long
 * operation reported as a coarse percentage, so a sub-second cadence buys
 * no responsiveness and costs a WordPress.com round trip per tick for its
 * whole duration.
 */
const POLL_INTERVAL_MS = 5000;

/**
 * How long the screen will go without a recognisable sign of life before
 * it admits it has lost track of the restore.
 *
 * Measured from the last sign of life, not from the start, so this does
 * not cap the restore itself: a two-hour restore of a large site keeps
 * polling for as long as it keeps reporting progress. It caps only
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
 * Whether a status reading counts as a sign of life, restarting the
 * silence deadline.
 *
 * Only `running` does, and deliberately not `queued` — which looks like
 * positive information and is not. WordPress.com's status enum is exactly
 * `running | success | fail | aborted | success-with-errors`; there is no
 * `queued` in it. Every `queued` the client sees is minted by our own
 * bridge, and overwhelmingly means *404 — that restore is not visible to
 * this route*. Treating it as a sign of life would mean a restore that
 * never materialises upstream answers 404 forever, resets the deadline
 * every time it does, and polls until the tab closes. That is precisely
 * the frozen-forever failure this hook exists to end.
 *
 * @param status - The status the bridge reported, if any.
 * @return True when the restore has demonstrably moved.
 */
function isSignOfLife( status: RestoreStatus | undefined ): boolean {
	return status === 'running';
}

/**
 * Whether a status reading ends the poll.
 *
 * @param status - The status the bridge reported, if any.
 * @return True when there is nothing left to wait for.
 */
function isTerminal( status: RestoreStatus | undefined ): boolean {
	return status !== undefined && ! LIVE_STATUSES.includes( status );
}

/**
 * Whether two rewind ids name the same backup.
 *
 * Adopting the wrong id would report someone else's restore as this one,
 * so this stays an equality test and never a prefix or integer-part
 * match: two restores of the same backup share an integer part.
 *
 * What it does tolerate is formatting. A rewind id is a unix timestamp
 * with a decimal suffix, and the value in `recent_restores[]` has been
 * round-tripped through VaultPress rather than echoed back by
 * WordPress.com — so a trailing zero gained or lost (`…613.9425` vs
 * `…613.94250`) would defeat a strict string comparison for two
 * representations of the same instant. Comparing them as numbers as well
 * closes that without widening what counts as a match.
 *
 * @param candidate - A rewind id from the restores collection.
 * @param target    - The rewind id this screen submitted.
 * @return True when both name the same backup.
 */
function sameRewindId( candidate: string, target: string ): boolean {
	if ( ! candidate || ! target ) {
		return false;
	}
	if ( candidate === target ) {
		return true;
	}
	const a = Number( candidate );
	const b = Number( target );
	return Number.isFinite( a ) && Number.isFinite( b ) && a === b;
}

type DeriveInput = {
	errorMessage: string | null;
	isPending: boolean;
	startedRewindId: string | null;
	restoreId: number | null;
	statusError: Error | null;
	data: RestoreStatusResponse | undefined;
	lostTrack: boolean;
};

/**
 * Collapse the queries into the one thing the screen renders.
 *
 * A pure function of its inputs, at module scope rather than inside the
 * hook: the phase is derived, never sampled. An earlier version read
 * `Date.now()` here to decide whether the silence deadline had passed,
 * which only worked while something else happened to be re-rendering —
 * see `lostTrack` for what replaced it.
 *
 * @param input - Everything the phase depends on.
 * @return The current phase.
 */
function deriveState( input: DeriveInput ): RestoreState {
	const { errorMessage, isPending, startedRewindId, restoreId, statusError, data, lostTrack } =
		input;

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
	if ( restoreId !== null && statusError ) {
		return {
			phase: 'error',
			message:
				statusError.message || __( 'Lost connection while restoring.', 'jetpack-backup-pkg' ),
		};
	}

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
			// reader: accepted, nothing to show. Unless it has been that
			// way long enough that we should stop implying something is
			// about to happen.
			if ( lostTrack ) {
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
	// When we last had a recognisable sign of life, and whether the
	// deadline measured from it has passed.
	//
	// Both are state rather than a ref, and the deadline is enforced by a
	// timer rather than compared against the clock while rendering. That
	// distinction is the whole point: in the no-id case nothing else is
	// re-rendering. The status query is disabled, the recovery query is
	// the only poller, and a refetch that keeps returning the same empty
	// list is structurally shared into the same array — so React Query's
	// observer never notifies, no render happens, and any deadline
	// evaluated during render is never reached. The screen would sit on
	// "queued and will begin shortly…" for as long as the tab stayed
	// open, which is the one scenario this recovery path exists for.
	const [ aliveAt, setAliveAt ] = useState< number | null >( null );
	const [ lostTrack, setLostTrack ] = useState( false );
	// Guards the sign-of-life effect against re-bumping the deadline for
	// a reading it has already seen.
	const lastSeenUpdateAt = useRef( 0 );

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
			// Acceptance starts the clock: it is the last thing we know
			// for certain until a status reading says otherwise.
			setAliveAt( Date.now() );
			setLostTrack( false );
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
	// Once the deadline has passed there is nothing left to recover, and
	// polling on would keep a request in flight behind an error notice.
	const recovering = needsId && ! lostTrack;
	const restoresQuery = useQuery( {
		queryKey: keys.recentRestores(),
		queryFn: fetchRecentRestores,
		enabled: recovering,
		refetchInterval: recovering ? POLL_INTERVAL_MS : false,
	} );

	const recoveredId = useMemo( () => {
		if ( ! needsId || startedRewindId === null ) {
			return null;
		}
		const match = restoresQuery.data?.find( row => sameRewindId( row.rewind_id, startedRewindId ) );
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
			// Keep asking through anything unrecognised — stopping there
			// is what froze this before — but not past the deadline.
			if ( isTerminal( query.state.data?.status ) || lostTrack ) {
				return false;
			}
			return POLL_INTERVAL_MS;
		},
	} );

	// A running restore is the only unambiguous sign of life. Recorded in
	// an effect rather than during render so the render stays pure.
	const observedStatus = statusQuery.data?.status;
	const statusUpdatedAt = statusQuery.dataUpdatedAt;
	useEffect( () => {
		if ( isSignOfLife( observedStatus ) && statusUpdatedAt > lastSeenUpdateAt.current ) {
			lastSeenUpdateAt.current = statusUpdatedAt;
			setAliveAt( Date.now() );
		}
	}, [ observedStatus, statusUpdatedAt ] );

	// The deadline, enforced by a timer so that it fires whether or not
	// anything else is happening. Restarted whenever a sign of life moves
	// `aliveAt`, cleared once there is nothing left to wait for.
	const settled = isTerminal( observedStatus );
	useEffect( () => {
		if ( aliveAt === null || lostTrack || settled ) {
			return;
		}
		const timer = setTimeout(
			() => setLostTrack( true ),
			Math.max( 0, QUIET_TIMEOUT_MS - ( Date.now() - aliveAt ) )
		);
		return () => clearTimeout( timer );
	}, [ aliveAt, lostTrack, settled ] );

	const submit = useCallback( ( items: RestoreItems ) => kickOff( items ), [ kickOff ] );
	const reset = useCallback( () => {
		setSubmittedId( null );
		setErrorMessage( null );
		setStartedRewindId( null );
		setAliveAt( null );
		setLostTrack( false );
		lastSeenUpdateAt.current = 0;
		resetMutation();
	}, [ resetMutation ] );

	const state = deriveState( {
		errorMessage,
		isPending,
		startedRewindId,
		restoreId,
		statusError: statusQuery.error,
		data: statusQuery.data,
		lostTrack,
	} );

	return { state, submit, reset };
}
