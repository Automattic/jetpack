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
			restores: [ { restore_id: 912682, rewind_id: REWIND_ID, status: 'running' } ],
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
			restores: [ { restore_id: 111, rewind_id: '1700000000.1', status: 'running' } ],
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
