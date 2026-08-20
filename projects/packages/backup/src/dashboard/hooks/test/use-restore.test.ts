// The restore state machine — the only place in this dashboard where a
// bug costs someone their site rather than their patience.
//
// It had no test at all, and was dead on arrival: the client tested for
// `in-progress`, `queued`, `finished` and `failed`, and WordPress.com has
// never returned any of those. Nothing noticed because the v1 route it
// called answered 401 before a status could come back, so the whole
// machine was unreachable rather than merely wrong.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { pickLiveRestore } from '../../data/api/restore';
import { DEFAULT_RESTORE_ITEMS } from '../../types/restore';
import { useRestore } from '../use-restore';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

const REWIND_ID = '1786663613.9425';
// A different backup point, for the cases where the restore already
// running is not the one this screen is pointed at.
const OTHER_ID = '1786512000.11';

/**
 * Fresh client per test, retries off so failures assert immediately.
 *
 * @return A wrapper providing an isolated QueryClient.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { wrapper };
}

/**
 * A projected status payload, in the shape the bridge returns.
 *
 * @param over - Fields to override on the default running payload.
 * @return The payload.
 */
function statusPayload( over: Record< string, unknown > = {} ) {
	return {
		id: 912682,
		status: 'running',
		progress: 0,
		rewind_id: REWIND_ID,
		error_code: '',
		message: '',
		...over,
	};
}

/**
 * Answer the initiate call, then every status poll.
 *
 * @param options               - Overrides.
 * @param options.initiate      - What the initiate call resolves with.
 * @param options.status        - What each status poll resolves with.
 * @param options.restores      - What `/jetpack/v4/restores` resolves with.
 * @param options.initiateError - What the initiate call rejects with, instead of resolving.
 */
function respondWith( {
	initiate = { id: 912682, rewind_id: REWIND_ID } as unknown,
	status = statusPayload() as unknown,
	restores = [] as unknown,
	initiateError = null as unknown,
} = {} ) {
	mockedApiFetch.mockImplementation( ( options: { path?: string; method?: string } ) => {
		if ( options?.method === 'POST' ) {
			return initiateError ? Promise.reject( initiateError ) : Promise.resolve( initiate );
		}
		if ( ( options?.path ?? '' ).includes( '/restores' ) ) {
			return Promise.resolve( restores );
		}
		return Promise.resolve( status );
	} );
}

type RenderedRestore = { current: { submit: ( items: typeof DEFAULT_RESTORE_ITEMS ) => void } };
type PhaseResult = { current: { state: { phase: string } } };

/**
 * Start a restore with every category selected.
 *
 * @param result - The rendered hook result.
 */
function submitAll( result: RenderedRestore ) {
	act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );
}

/**
 * Advance fake timers inside `act`, letting queued promises settle.
 *
 * Only usable inside a suite that installed fake timers — they are set
 * up per-describe rather than file-wide, because every other suite here
 * depends on React Query's real polling.
 *
 * @param ms - How far to advance.
 */
async function advance( ms: number ) {
	await act( async () => {
		await jest.advanceTimersByTimeAsync( ms );
	} );
}

/**
 * Wait for the hook to reach a phase before jumping the clock.
 *
 * Required rather than tidy: the deadline timer is scheduled when the
 * restore is accepted, so a single large `advance()` from a standing
 * start moves the clock past the point the timer is armed at, and it
 * is then scheduled to fire five minutes after a `now` the test has
 * already left behind. Real time does not jump.
 *
 * @param result - The rendered hook result.
 * @param phase  - The phase to wait for.
 */
async function settleAt( result: PhaseResult, phase: string ) {
	await waitFor( () => expect( result.current.state.phase ).toBe( phase ) );
}

/**
 * The initiate request, whenever it was made.
 *
 * @return The apiFetch options for the POST.
 */
function initiateCall() {
	// Not `calls[ 0 ]` any more: every cold mount asks what is already
	// running before the reader can submit anything.
	const call = mockedApiFetch.mock.calls.find( ( [ o ] ) => o?.method === 'POST' );
	return call?.[ 0 ];
}

/**
 * How many times a path fragment has been requested so far.
 *
 * @param fragment - Substring of the request path.
 * @return The call count.
 */
function callsFor( fragment: string ): number {
	return mockedApiFetch.mock.calls.filter( ( [ o ] ) => ( o?.path ?? '' ).includes( fragment ) )
		.length;
}

beforeEach( () => {
	mockedApiFetch.mockReset();
} );

describe( 'useRestore — the request', () => {
	it( 'sends the rewind id in full, and never in the upstream path', async () => {
		respondWith();
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( initiateCall() ).toBeDefined() );
		const initiate = initiateCall();
		// Truncating it addresses a different backup than the reader picked.
		expect( initiate.path ).toContain( REWIND_ID );
		expect( initiate.path ).not.toContain( '1786663613/' );
	} );

	it( 'sends types as an object, never as an array', async () => {
		respondWith();
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( { ...DEFAULT_RESTORE_ITEMS, plugins: false } ) );

		await waitFor( () => expect( initiateCall() ).toBeDefined() );
		const initiate = initiateCall();
		expect( Array.isArray( initiate.data.types ) ).toBe( false );
		expect( initiate.data.types.plugins ).toBeUndefined();
		expect( initiate.data.types.themes ).toBe( true );
	} );
} );

describe( 'useRestore — terminal states', () => {
	// Each of these was unreachable before: the client was checking for
	// status strings WordPress.com does not emit.
	it( 'reaches success on finished', async () => {
		respondWith( { status: statusPayload( { status: 'finished', progress: 100 } ) } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'success' ) );
	} );

	it( 'reaches its own state on finished-with-errors, not success', async () => {
		respondWith( {
			status: statusPayload( {
				status: 'finished-with-errors',
				message: '3 files could not be written.',
			} ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'success-with-errors' ) );
		expect( result.current.state ).toMatchObject( { message: '3 files could not be written.' } );
	} );

	it( 'reaches error on failed, and on aborted', async () => {
		respondWith( { status: statusPayload( { status: 'failed', message: 'Restore aborted.' } ) } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'error' ) );
		expect( result.current.state ).toMatchObject( { message: 'Restore aborted.' } );
	} );

	it( 'never shows the machine error code to the reader', async () => {
		respondWith( {
			status: statusPayload( { status: 'failed', message: '', error_code: 'checksum_mismatch' } ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'error' ) );
		expect( JSON.stringify( result.current.state ) ).not.toContain( 'checksum_mismatch' );
	} );

	it( 'reports progress while running', async () => {
		respondWith( { status: statusPayload( { status: 'running', progress: 42 } ) } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'progress' ) );
		expect( result.current.state ).toMatchObject( { percent: 42 } );
	} );
} );

describe( 'useRestore — a restore WordPress.com accepted without naming', () => {
	// VaultPress does not reliably echo an id back, so `restore_id: null`
	// is a queued restore rather than a failure. The old bridge reported
	// it as a 500.
	it( 'stays queued rather than failing when no id comes back', async () => {
		respondWith( { initiate: { id: null, rewind_id: REWIND_ID } } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'queued' ) );
	} );

	it( 'recovers the id from the restores collection and resumes polling', async () => {
		respondWith( {
			initiate: { id: null, rewind_id: REWIND_ID },
			restores: [ { restore_id: 912682, rewind_id: REWIND_ID } ],
			status: statusPayload( { status: 'running', progress: 17 } ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'progress' ) );
		expect( result.current.state ).toMatchObject( { percent: 17 } );
	} );

	it( 'ignores a settled restore of a different backup', async () => {
		respondWith( {
			initiate: { id: null, rewind_id: REWIND_ID },
			restores: [
				{
					restore_id: 111,
					rewind_id: '1700000000.1',
					when: '2026-08-01T10:00:00+00:00',
					status: 'finished',
				},
			],
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'queued' ) );
		// Adopting the wrong id would report someone else's restore as this one.
		expect( callsFor( '/rewind/restore/111/status' ) ).toBe( 0 );
	} );
} );

describe( 'useRestore — failing safe', () => {
	// The bug this replaces: the poll stopped on any status it did not
	// recognise, which was all of them, freezing the bar at its first
	// reading with no timeout and no escape.
	it( 'keeps polling through an unrecognised status instead of freezing', async () => {
		respondWith( { status: statusPayload( { status: 'unknown', progress: 5 } ) } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		// Reported as queued rather than as a stalled progress bar...
		await waitFor( () => expect( result.current.state.phase ).toBe( 'queued' ) );
		// ...and it has not given up: no terminal state was reached.
		expect( result.current.state.phase ).not.toBe( 'error' );
		expect( result.current.state.phase ).not.toBe( 'success' );
	} );

	// Losing the connection is not the same as the restore failing: it
	// was accepted and is very likely still running. Reporting it as an
	// error would offer a retry, and the retry starts a second concurrent
	// restore — so it reports what is true, that we can no longer watch.
	it( 'surfaces a mid-poll network failure rather than sitting at the last percent', async () => {
		mockedApiFetch.mockImplementation( ( options: { method?: string } ) => {
			if ( options?.method === 'POST' ) {
				return Promise.resolve( { id: 912682, rewind_id: REWIND_ID } );
			}
			return Promise.reject( new Error( 'Could not reach WordPress.com.' ) );
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'lost-track' ) );
		// The transport's own text is kept, beneath the message rather
		// than replacing it.
		expect( result.current.state ).toMatchObject( { detail: 'Could not reach WordPress.com.' } );
	} );

	// The property the phase exists for, asserted on the state machine as
	// well as on the screen: `error` is reserved for "nothing is running".
	it( 'reserves the error phase for restores that definitely are not running', async () => {
		respondWith( { status: statusPayload( { status: 'failed', message: 'Restore aborted.' } ) } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'error' ) );
	} );

	it( 'reports a refused submission and can be reset back to idle', async () => {
		mockedApiFetch.mockRejectedValue( new Error( 'Could not start the backup restore.' ) );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'error' ) );

		act( () => result.current.reset() );
		expect( result.current.state.phase ).toBe( 'idle' );
	} );
} );

describe( 'useRestore — the silence deadline', () => {
	// The deadline is enforced by a timer, not by comparing the clock
	// while rendering, and these are the cases that tell the difference.
	// Fake timers here rather than in the file-wide setup: every other
	// suite depends on React Query's real polling.
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	// The case with no safety net before: the status query is disabled
	// while the id is unknown, so the recovery poll is the only thing
	// running — and a refetch that keeps returning the same empty list is
	// structurally shared into the same array, so the observer never
	// notifies and nothing re-renders. A deadline evaluated during render
	// is never reached, and the reader is left on "queued and will begin
	// shortly…" indefinitely, having just been told a destructive
	// operation was about to start.
	it( 'gives up on a restore accepted without an id that never appears in the collection', async () => {
		respondWith( { initiate: { id: null, rewind_id: REWIND_ID }, restores: [] } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'queued' );

		// Still queued a minute in — the deadline caps silence, it does
		// not cap the restore.
		await advance( 60_000 );
		expect( result.current.state.phase ).toBe( 'queued' );

		await advance( 5 * 60_000 );
		// `lost-track`, never `error`: the screen offers "Try again" on
		// `error`, and here that would start a second concurrent restore.
		expect( result.current.state.phase ).toBe( 'lost-track' );
		expect( result.current.state ).toMatchObject( { detail: null } );
	} );

	it( 'gives up on a restore whose status never leaves queued', async () => {
		respondWith( { status: statusPayload( { status: 'queued' } ) } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'queued' );

		await advance( 5 * 60_000 + 1000 );
		expect( result.current.state.phase ).toBe( 'lost-track' );
		expect( result.current.state ).toMatchObject( { detail: null } );
	} );

	// The half that matters as much as firing: a long restore that keeps
	// reporting progress must never be cut off. Each `running` reading
	// restarts the deadline.
	it( 'never cuts off a restore that keeps reporting progress', async () => {
		respondWith( { status: statusPayload( { status: 'running', progress: 12 } ) } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'progress' );

		// Twenty minutes of steady progress, four times the deadline.
		await advance( 20 * 60_000 );
		expect( result.current.state.phase ).toBe( 'progress' );
	} );

	it( 'stops polling once it has given up', async () => {
		respondWith( { initiate: { id: null, rewind_id: REWIND_ID }, restores: [] } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'queued' );
		await advance( 5 * 60_000 + 1000 );
		expect( result.current.state.phase ).toBe( 'lost-track' );

		const before = mockedApiFetch.mock.calls.length;
		await advance( 60_000 );
		// A request in flight behind an error notice is a request nobody
		// will ever read the answer to.
		expect( mockedApiFetch.mock.calls ).toHaveLength( before );
	} );

	it( 'starts over after a reset', async () => {
		respondWith( { initiate: { id: null, rewind_id: REWIND_ID }, restores: [] } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'queued' );
		await advance( 5 * 60_000 + 1000 );
		expect( result.current.state.phase ).toBe( 'lost-track' );

		act( () => result.current.reset() );
		expect( result.current.state.phase ).toBe( 'idle' );
	} );
} );

describe( 'useRestore — a restore already running when the screen opens', () => {
	// Every piece of restore state lived in `useState`, so a reload, a
	// second tab, or a restore started from Calypso left this screen at
	// `idle` with an armed Confirm button — one click from a second
	// concurrent whole-site restore, with nothing on screen saying the
	// first was still running.

	it( 'adopts a running restore instead of arming the form', async () => {
		respondWith( {
			restores: [
				{
					restore_id: 912682,
					rewind_id: OTHER_ID,
					when: '2026-08-20T10:00:00+00:00',
					status: 'running',
				},
			],
			status: statusPayload( { id: 912682, status: 'running', progress: 55, rewind_id: OTHER_ID } ),
		} );
		const { wrapper } = makeWrapper();

		// No submit: this is a cold mount.
		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'progress' ) );
		expect( result.current.state ).toMatchObject( { percent: 55 } );
	} );

	it( 'reports which backup the running restore is for, not the one in the URL', async () => {
		// The site is being overwritten either way, so a restore of a
		// *different* backup is adopted too — and then has to say so, or
		// the reader is left wondering why their checklist vanished.
		respondWith( {
			restores: [
				{
					restore_id: 912682,
					rewind_id: OTHER_ID,
					when: '2026-08-20T10:00:00+00:00',
					status: 'running',
				},
			],
			status: statusPayload( { id: 912682, status: 'running', rewind_id: OTHER_ID } ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );

		await waitFor( () => expect( result.current.adopted ).not.toBeNull() );
		expect( result.current.adopted ).toEqual( { rewindId: OTHER_ID } );
	} );

	it( 'arms the form when the most recent restore has finished', async () => {
		respondWith( {
			restores: [
				{
					restore_id: 111,
					rewind_id: REWIND_ID,
					when: '2026-08-10T10:00:00+00:00',
					status: 'finished',
				},
			],
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'idle' ) );
		expect( result.current.adopted ).toBeNull();
		expect( callsFor( '/rewind/restore/111/status' ) ).toBe( 0 );
	} );

	it( 'withholds the form until it knows whether anything is running', async () => {
		// Arming first and correcting later would put a live Confirm
		// button on screen for exactly as long as the lookup takes.
		respondWith( {
			restores: [
				{
					restore_id: 912682,
					rewind_id: OTHER_ID,
					when: '2026-08-20T10:00:00+00:00',
					status: 'running',
				},
			],
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );

		expect( result.current.state.phase ).toBe( 'checking' );
	} );

	it( 'drops the adoption when the candidate turns out to have finished', async () => {
		// The collection's status vocabulary is not the status route's, so
		// a row we could not read as settled is confirmed against the
		// route that speaks our own. Terminal there means it is not a
		// restore in progress, and the reader gets their form.
		respondWith( {
			restores: [
				{
					restore_id: 912682,
					rewind_id: OTHER_ID,
					when: '2026-08-20T10:00:00+00:00',
					status: 'some-spelling-we-do-not-know',
				},
			],
			status: statusPayload( { id: 912682, status: 'finished', rewind_id: OTHER_ID } ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'idle' ) );
		expect( result.current.adopted ).toBeNull();
	} );
} );

describe( 'useRestore — the recovery poll', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'stops asking the collection once it has recovered the id', async () => {
		// The recovery query is gated on "started, and no id yet". The id
		// arrived, but it arrived in a `useMemo` derived from the query's
		// own data — so the gate kept reading "no id yet" and the
		// collection was fetched every five seconds for the life of the
		// tab, including long after the restore had finished.
		respondWith( {
			initiate: { id: null, rewind_id: REWIND_ID },
			restores: [ { restore_id: 912682, rewind_id: REWIND_ID } ],
			status: statusPayload( { status: 'running', progress: 17 } ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'progress' );
		const before = callsFor( '/restores' );

		await advance( 30_000 );

		expect( callsFor( '/restores' ) ).toBe( before );
		// The status poll is the one that should still be running.
		expect( callsFor( '/rewind/restore/912682/status' ) ).toBeGreaterThan( 1 );
	} );
} );

describe( 'useRestore — matching the restore we started', () => {
	it( 'matches a rewind id the collection formatted differently', async () => {
		// The value in `recent_restores[]` has been round-tripped through
		// VaultPress rather than echoed back, so a trailing zero gained or
		// lost is the same instant spelled two ways. A strict string
		// comparison would miss it and leave the restore unrecoverable.
		respondWith( {
			initiate: { id: null, rewind_id: REWIND_ID },
			restores: [ { restore_id: 912682, rewind_id: `${ REWIND_ID }0` } ],
			status: statusPayload( { status: 'running', progress: 33 } ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'progress' ) );
		expect( result.current.state ).toMatchObject( { percent: 33 } );
	} );

	it( 'refuses a restore of this backup that has already finished', async () => {
		// The same backup point can be restored more than once. The match
		// was `find()` over the collection, so an earlier, completed
		// restore of this backup was adopted as the one just started —
		// and its status route answers `finished`, so the screen said
		// "Restore complete." while the real restore was still
		// overwriting the site.
		respondWith( {
			initiate: { id: null, rewind_id: REWIND_ID },
			restores: [
				{
					restore_id: 111,
					rewind_id: REWIND_ID,
					when: '2026-08-10T10:00:00+00:00',
					status: 'finished',
				},
			],
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'queued' ) );
		expect( callsFor( '/rewind/restore/111/status' ) ).toBe( 0 );
	} );

	it( 'adopts the newest matching restore rather than the first row', async () => {
		// Ordering is taken from `when`, and only ever by comparing two
		// WordPress.com timestamps against each other — never against the
		// browser's clock, which can be minutes out and would then reject
		// the restore we just started.
		respondWith( {
			initiate: { id: null, rewind_id: REWIND_ID },
			restores: [
				{ restore_id: 111, rewind_id: REWIND_ID, when: '2026-08-10T10:00:00+00:00' },
				{ restore_id: 912682, rewind_id: REWIND_ID, when: '2026-08-20T10:00:00+00:00' },
			],
			status: statusPayload( { status: 'running', progress: 42 } ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'progress' ) );
		expect( callsFor( '/rewind/restore/912682/status' ) ).toBeGreaterThan( 0 );
		expect( callsFor( '/rewind/restore/111/status' ) ).toBe( 0 );
	} );
} );

describe( 'pickLiveRestore', () => {
	// Rewind-id discrimination is proved here rather than through the
	// hook. Since the screen now adopts whatever restore is already
	// running, a *live* restore of another backup means the form is never
	// armed — so "submit, then fail to match it" is a state the UI no
	// longer reaches, and a hook test for it would assert against a
	// scenario that cannot happen. The rule still has to hold.
	const row = ( over: Record< string, unknown > = {} ) => ( {
		restore_id: 1,
		rewind_id: REWIND_ID,
		when: '2026-08-20T10:00:00+00:00',
		settled: false,
		...over,
	} );

	it( 'refuses a different backup taken in the same second', () => {
		// Two restores of the same second share an integer part, so this
		// stays an equality test and never a prefix match.
		expect(
			pickLiveRestore( [ row( { restore_id: 111, rewind_id: '1786663613.1111' } ) ], REWIND_ID )
		).toBeNull();
	} );

	it( 'refuses an unrelated backup', () => {
		expect(
			pickLiveRestore( [ row( { restore_id: 111, rewind_id: '1700000000.1' } ) ], REWIND_ID )
		).toBeNull();
	} );

	it( 'matches a rewind id the collection formatted differently', () => {
		expect(
			pickLiveRestore( [ row( { restore_id: 912682, rewind_id: `${ REWIND_ID }0` } ) ], REWIND_ID )
		).toMatchObject( { restore_id: 912682 } );
	} );

	it( 'takes any backup when asked for any, which is the cold-mount case', () => {
		expect(
			pickLiveRestore( [ row( { restore_id: 111, rewind_id: '1700000000.1' } ) ], null )
		).toMatchObject( { restore_id: 111 } );
	} );

	it( 'never takes a settled row, whichever backup it names', () => {
		expect( pickLiveRestore( [ row( { restore_id: 111, settled: true } ) ], null ) ).toBeNull();
	} );

	it( 'sorts a row with no usable timestamp last rather than dropping it', () => {
		const rows = [ row( { restore_id: 5, when: '' } ), row( { restore_id: 6 } ) ];
		expect( pickLiveRestore( rows, null ) ).toMatchObject( { restore_id: 6 } );
		expect( pickLiveRestore( [ rows[ 0 ] ], null ) ).toMatchObject( { restore_id: 5 } );
	} );
} );

describe( 'useRestore — a submission we never got an answer to', () => {
	// The rule the state machine already stated: a retry is offered only
	// when we know nothing is running. A transport failure is the one
	// case where we know the least — WordPress.com may have queued the
	// restore and the reply may simply have been lost — and it was
	// landing in `error`, whose only control resets to an armed Confirm.
	//
	// `data.transport` is the marker. All three initiate failures share
	// the code `restore_initiate_failed`; only `Rest_Controller::
	// transport_error()` attaches a transport payload.
	const TIMEOUT = {
		code: 'restore_initiate_failed',
		message: 'Could not reach WordPress.com. Check your connection and try again.',
		data: {
			status: 502,
			transport: { code: 'http_request_failed', message: 'cURL error 28: Operation timed out' },
		},
	};

	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'does not offer a retry while the restore may be running', async () => {
		respondWith( { initiateError: TIMEOUT, restores: [] } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'unconfirmed' );
		// The point of the phase: no control at all until we know.
		expect( result.current.state ).not.toMatchObject( { phase: 'error' } );
	} );

	it( 'adopts the restore when it turns out to have started', async () => {
		respondWith( {
			initiateError: TIMEOUT,
			restores: [
				{
					restore_id: 912682,
					rewind_id: REWIND_ID,
					when: '2026-08-20T10:00:00+00:00',
					status: 'running',
				},
			],
			status: statusPayload( { status: 'running', progress: 12 } ),
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'progress' );
		expect( result.current.state ).toMatchObject( { percent: 12 } );
	} );

	it( 'offers a retry once the deadline proves nothing started', async () => {
		respondWith( { initiateError: TIMEOUT, restores: [] } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'unconfirmed' );
		await advance( 5 * 60_000 + 1000 );

		// Now — and only now — a retry is safe, because five minutes of
		// looking found no restore of this backup.
		expect( result.current.state.phase ).toBe( 'error' );
	} );

	it( 'still reports a refusal immediately, because nothing started', async () => {
		// WordPress.com answered. There is no ambiguity to resolve, so
		// making the reader wait five minutes for a retry would be a
		// regression.
		respondWith( {
			initiateError: {
				code: 'restore_initiate_failed',
				message: 'Could not start the backup restore.',
				data: { status: 412 },
			},
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'error' );
		expect( result.current.state ).toMatchObject( {
			message: 'Could not start the backup restore.',
		} );
	} );
} );
