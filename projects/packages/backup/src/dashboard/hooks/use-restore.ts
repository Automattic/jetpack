import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isAmbiguousFailure } from '../data/api/_helpers';
import {
	fetchRecentRestores,
	fetchRestoreStatus,
	fetchRunningRestore,
	initiateRestore,
	isTerminal,
	pickLiveRestore,
} from '../data/api/restore';
import { keys } from '../data/query-client';
import { useAdoptedRestore } from './use-adopted-restore';
import type { AdoptedRestore } from './use-adopted-restore';
import type { RestoreStatus, RestoreStatusResponse } from '../data/api/restore';
import type { RestoreItems, RestoreState } from '../types/restore';

type Result = {
	state: RestoreState;
	submit: ( items: RestoreItems ) => void;
	reset: () => void;
	/**
	 * Set when the restore on screen was already running before this
	 * screen opened, rather than started here. Carries the backup it is
	 * restoring, which need not be the one in the URL — see
	 * `useAdoptedRestore`.
	 */
	adopted: { rewindId: string } | null;
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

type DeriveInput = {
	errorMessage: string | null;
	isPending: boolean;
	isChecking: boolean;
	unconfirmed: string | null;
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
	const {
		errorMessage,
		isPending,
		isChecking,
		unconfirmed,
		startedRewindId,
		restoreId,
		statusError,
		data,
		lostTrack,
	} = input;

	if ( errorMessage ) {
		return { phase: 'error', message: errorMessage };
	}
	// `startedRewindId` is read before `isPending`: React Query never reattaches a
	// MutationObserver detached mid-flight, so a remount latches `isPending` true
	// while the mutation's own callbacks still record the acceptance.
	if ( startedRewindId === null ) {
		if ( isPending ) {
			return { phase: 'submitting' };
		}
		// Nothing of our own, and we may not yet know whether the site has
		// a restore running from somewhere else. Withholding the form is
		// the whole point: see `useAdoptedRestore`.
		return isChecking ? { phase: 'checking' } : { phase: 'idle' };
	}
	// A submission whose answer never arrived, and no restore found for it
	// yet. The rule this serves is the one `RestoreState` states: a retry
	// is offered only when we know nothing is running. Five minutes of
	// looking and finding nothing is that knowledge — before it, offering
	// one would risk a second concurrent restore.
	if ( unconfirmed !== null && restoreId === null ) {
		if ( lostTrack ) {
			return {
				phase: 'error',
				message: __(
					"Your restore didn't start, so nothing on your site has changed.",
					'jetpack-backup-pkg'
				),
			};
		}
		return { phase: 'unconfirmed', detail: unconfirmed };
	}
	// A network failure mid-poll, surfaced rather than left sitting at
	// the last known percent with no way out.
	//
	// `lost-track` and not `error`: the restore was accepted and is very
	// likely still running — we just cannot watch it any more. Reporting
	// that as an error offers a retry, and the retry starts a second
	// concurrent restore of the same site.
	if ( restoreId !== null && statusError ) {
		return { phase: 'lost-track', detail: statusError.message || null };
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
			return {
				phase: 'progress',
				percent: Math.round( data.progress ?? 0 ),
				message: data.message,
			};
		default:
			// `queued`, `unknown`, or nothing yet. All the same to the
			// reader: accepted, nothing to show. Unless it has been that
			// way long enough that we should stop implying something is
			// about to happen.
			//
			// The copy for that lives on the screen, like every other
			// phase's: this one is entirely ours, with no upstream part.
			if ( lostTrack ) {
				return { phase: 'lost-track', detail: null };
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
 * Four things make this more than a request and a poll.
 *
 * A restore may already be running before this screen ever mounts — from
 * a reload, a second tab, or Calypso. None of this hook's state survives
 * a page load, so the screen has to go and ask; until it has an answer it
 * shows neither the form nor a progress bar. See `useAdoptedRestore`.
 *
 * A submission whose answer never arrived is not a failure. WordPress.com
 * may have queued the restore and lost only the reply, so the outcome
 * goes into the same recovery the no-id case uses rather than into
 * `error` — whose only control resets to an armed Confirm button.
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
	// Non-null while a submission's outcome is unknown, holding the
	// transport's own text. Distinct from `errorMessage`, which means
	// WordPress.com answered and said no.
	const [ unconfirmed, setUnconfirmed ] = useState< string | null >( null );
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
		mutationFn: async ( items: RestoreItems ) => {
			// The mount lookup answered once, possibly a long time ago. A
			// screen left open while a colleague started a restore from
			// Calypso is the very scenario this hook exists for, just
			// displaced in time — and the click is the moment it matters.
			//
			// Fail open on the read, closed on the evidence: a restore is
			// refused only on positive proof that one is running. Someone
			// reaching for a restore is often mid-outage, and denying them
			// their recovery because a list could not be fetched would be
			// the worse failure by far.
			const running = await fetchRunningRestore().catch( () => null );
			if ( running !== null ) {
				return { adopt: running } as const;
			}
			return { started: await initiateRestore( rewindId, items ) } as const;
		},
		onSuccess: outcome => {
			if ( 'adopt' in outcome ) {
				setErrorMessage( null );
				setAdopted( { id: outcome.adopt.restore_id, rewindId: outcome.adopt.rewind_id } );
				setAliveAt( Date.now() );
				setLostTrack( false );
				return;
			}
			const result = outcome.started;
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
			// We never saw an answer, so the restore may be running. Enter
			// the same recovery the no-id case uses and let it decide:
			// finding one adopts it, finding none for the whole silence
			// deadline is what finally makes a retry safe to offer.
			if ( isAmbiguousFailure( err ) ) {
				setUnconfirmed( err.message || null );
				setStartedRewindId( rewindId );
				setAliveAt( Date.now() );
				setLostTrack( false );
				return;
			}
			setErrorMessage( err.message );
		},
	} );

	// What this site already has running, if anything. Disabled the
	// moment this screen has a submission of its own: from then on the
	// restore on screen is ours, and the lookup would only be a second
	// opinion about a question we can already answer.
	const hasOwnSubmission = startedRewindId !== null || isPending;
	const { adopted: found, isChecking } = useAdoptedRestore( ! hasOwnSubmission );

	// Latched, not read live, and that distinction is the whole
	// lifecycle. `useAdoptedRestore` derives its answer from a
	// confirmation query that shares a key with the status poll below —
	// so the render that first reads `finished` is the same render in
	// which the live value goes null. Reading it directly meant
	// `restoreId` collapsed to null at exactly that moment,
	// `deriveState` fell through to `idle`, and the reader who had been
	// watching a progress bar was handed the armed Confirm button this
	// screen exists to withhold. Every terminal branch below was
	// unreachable for an adopted restore.
	//
	// The lookup decides only *whether* to adopt. Once it has, the
	// ordinary poll owns the rest, exactly as it does for a restore
	// started here.
	const [ adopted, setAdopted ] = useState< AdoptedRestore | null >( null );
	useEffect( () => {
		if ( found !== null && ! hasOwnSubmission ) {
			setAdopted( previous => previous ?? found );
			// An adopted restore was accepted before this screen existed,
			// so the silence deadline starts from the moment we found it
			// rather than from a submission that never happened here.
			setAliveAt( previous => previous ?? Date.now() );
		}
	}, [ found, hasOwnSubmission ] );

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
		const match = pickLiveRestore( restoresQuery.data ?? null, startedRewindId );
		return match ? match.restore_id : null;
	}, [ needsId, restoresQuery.data, startedRewindId ] );

	// Promote a recovered id into state, which is what closes the gate
	// above. Left purely derived, `submittedId` stayed null forever, so
	// `needsId` never went false and the collection was fetched every
	// five seconds for the life of the tab — long after the restore had
	// finished, and behind a screen with nothing left to recover.
	useEffect( () => {
		if ( recoveredId !== null && submittedId === null ) {
			setSubmittedId( recoveredId );
		}
	}, [ recoveredId, submittedId ] );

	// An adoption stands in for a submission on both counts: it names the
	// restore to poll, and it is what the screen renders instead of the
	// form.
	const restoreId = submittedId ?? recoveredId ?? adopted?.id ?? null;
	const activeRewindId = startedRewindId ?? adopted?.rewindId ?? null;

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
		setAdopted( null );
		setSubmittedId( null );
		setErrorMessage( null );
		setUnconfirmed( null );
		setStartedRewindId( null );
		setAliveAt( null );
		setLostTrack( false );
		lastSeenUpdateAt.current = 0;
		resetMutation();
	}, [ resetMutation ] );

	const state = deriveState( {
		errorMessage,
		isPending,
		isChecking,
		unconfirmed,
		startedRewindId: activeRewindId,
		restoreId,
		statusError: statusQuery.error,
		data: statusQuery.data,
		lostTrack,
	} );

	return {
		state,
		submit,
		reset,
		adopted: adopted && ! hasOwnSubmission ? { rewindId: adopted.rewindId } : null,
	};
}
