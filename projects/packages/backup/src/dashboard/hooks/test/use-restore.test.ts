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
import { DEFAULT_RESTORE_ITEMS } from '../../types/restore';
import { useRestore } from '../use-restore';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

const REWIND_ID = '1786663613.9425';

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
 * @param options          - Overrides.
 * @param options.initiate - What the initiate call resolves with.
 * @param options.status   - What each status poll resolves with.
 * @param options.restores - What `/jetpack/v4/restores` resolves with.
 */
function respondWith( {
	initiate = { id: 912682, rewind_id: REWIND_ID } as unknown,
	status = statusPayload() as unknown,
	restores = [] as unknown,
} = {} ) {
	mockedApiFetch.mockImplementation( ( options: { path?: string; method?: string } ) => {
		if ( options?.method === 'POST' ) {
			return Promise.resolve( initiate );
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

beforeEach( () => {
	mockedApiFetch.mockReset();
} );

describe( 'useRestore — the request', () => {
	it( 'sends the rewind id in full, and never in the upstream path', async () => {
		respondWith();
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( mockedApiFetch ).toHaveBeenCalled() );
		const [ initiate ] = mockedApiFetch.mock.calls[ 0 ];
		// Truncating it addresses a different backup than the reader picked.
		expect( initiate.path ).toContain( REWIND_ID );
		expect( initiate.path ).not.toContain( '1786663613/' );
	} );

	it( 'sends types as an object, never as an array', async () => {
		respondWith();
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( { ...DEFAULT_RESTORE_ITEMS, plugins: false } ) );

		await waitFor( () => expect( mockedApiFetch ).toHaveBeenCalled() );
		const [ initiate ] = mockedApiFetch.mock.calls[ 0 ];
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

	it( 'ignores a restore of a different backup', async () => {
		respondWith( {
			initiate: { id: null, rewind_id: REWIND_ID },
			restores: [ { restore_id: 111, rewind_id: '1700000000.1' } ],
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'queued' ) );
		// Adopting the wrong id would report someone else's restore as this one.
		const polled = mockedApiFetch.mock.calls.some( ( [ o ] ) =>
			( o?.path ?? '' ).includes( '/rewind/restore/111/status' )
		);
		expect( polled ).toBe( false );
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

		await waitFor( () => expect( result.current.state.phase ).toBe( 'error' ) );
		expect( result.current.state ).toMatchObject( { message: 'Could not reach WordPress.com.' } );
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

	const LOST_TRACK = /lost track of this restore/;

	/**
	 * Advance fake timers inside `act`, letting queued promises settle.
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
		expect( result.current.state.phase ).toBe( 'error' );
		expect( result.current.state ).toMatchObject( {
			message: expect.stringMatching( LOST_TRACK ),
		} );
	} );

	it( 'gives up on a restore whose status never leaves queued', async () => {
		respondWith( { status: statusPayload( { status: 'queued' } ) } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await settleAt( result, 'queued' );

		await advance( 5 * 60_000 + 1000 );
		expect( result.current.state.phase ).toBe( 'error' );
		expect( result.current.state ).toMatchObject( {
			message: expect.stringMatching( LOST_TRACK ),
		} );
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
		expect( result.current.state.phase ).toBe( 'error' );

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
		expect( result.current.state.phase ).toBe( 'error' );

		act( () => result.current.reset() );
		expect( result.current.state.phase ).toBe( 'idle' );
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

	it( 'still refuses a different backup taken in the same second', async () => {
		respondWith( {
			initiate: { id: null, rewind_id: REWIND_ID },
			restores: [ { restore_id: 111, rewind_id: '1786663613.1111' } ],
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useRestore( REWIND_ID ), { wrapper } );
		submitAll( result );

		await waitFor( () => expect( result.current.state.phase ).toBe( 'queued' ) );
		const polled = mockedApiFetch.mock.calls.some( ( [ o ] ) =>
			( o?.path ?? '' ).includes( '/rewind/restore/111/status' )
		);
		expect( polled ).toBe( false );
	} );
} );
