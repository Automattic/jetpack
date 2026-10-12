import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { DEFAULT_RESTORE_ITEMS } from '../../types/restore';
import { useDownload } from '../use-download';

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
 * Answer the initiate call, then every status poll with `status`.
 *
 * @param status - The projected status payload the bridge would return.
 */
function respondWith( status: Record< string, unknown > ) {
	mockedApiFetch.mockImplementation( ( options: { path?: string; method?: string } ) => {
		if ( options?.method === 'POST' ) {
			return Promise.resolve( { id: 4321 } );
		}
		return Promise.resolve( status );
	} );
}

beforeEach( () => {
	mockedApiFetch.mockReset();
} );

describe( 'useDownload', () => {
	it( 'sends the rewind id in full, and the types as an object', async () => {
		respondWith( {
			id: 4321,
			status: 'running',
			progress: 0,
			url: '',
			valid_until: '',
			error: '',
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () =>
			result.current.submit( {
				...DEFAULT_RESTORE_ITEMS,
				plugins: false,
				roots: false,
				contents: false,
				uploads: false,
			} )
		);

		await waitFor( () => expect( mockedApiFetch ).toHaveBeenCalled() );
		const [ initiate ] = mockedApiFetch.mock.calls[ 0 ];
		// The decimal suffix is significant — truncating it addresses a
		// different backup than the one the reader picked.
		expect( initiate.path ).toContain( REWIND_ID );
		expect( Array.isArray( initiate.data.types ) ).toBe( false );
		// A partial selection, so this proves the filtering rather than
		// echoing an all-true default back at itself.
		expect( initiate.data.types ).toEqual( { themes: true, sqls: true } );
	} );

	// `progress` is already 0–100: WPCOM coerces it to an integer, which
	// a 0–1 float could not survive. The old `* 100` fed the ProgressBar
	// values up to 10000.
	it( 'reports progress on the 0-100 scale it arrives on', async () => {
		respondWith( {
			id: 4321,
			status: 'running',
			progress: 42,
			url: '',
			valid_until: '',
			error: '',
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );

		await waitFor( () =>
			expect( result.current.state ).toEqual( { phase: 'progress', percent: 42 } )
		);
	} );

	it( 'resolves to the archive url when the download finishes', async () => {
		respondWith( {
			id: 4321,
			status: 'finished',
			progress: 0,
			url: 'https://example.com/archive.zip',
			valid_until: '2026-08-20T00:00:00+00:00',
			error: '',
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );

		await waitFor( () =>
			expect( result.current.state ).toEqual( {
				phase: 'success',
				downloadUrl: 'https://example.com/archive.zip',
				validUntil: '2026-08-20T00:00:00+00:00',
			} )
		);
	} );

	it( 'names the backup and the code when the download never starts', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'download_initiate_failed',
			message: 'Could not prepare the download.',
			data: { status: 500, wpcom: { code: 'rewind_error' } },
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );

		await waitFor( () =>
			expect( result.current.state ).toMatchObject( {
				phase: 'error',
				reference: { code: 'rewind_error', id: { kind: 'backup', value: REWIND_ID } },
			} )
		);
	} );

	it( "surfaces WPCOM's reason when the download fails", async () => {
		respondWith( {
			id: 4321,
			status: 'failed',
			progress: 0,
			url: '',
			valid_until: '',
			error: 'Archive expired',
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );

		await waitFor( () =>
			expect( result.current.state ).toEqual( {
				phase: 'error',
				// Carried inside a translated frame rather than shown raw.
				message: 'Download failed: Archive expired',
				reference: { code: null, id: { kind: 'download', value: 4321 } },
			} )
		);
	} );
} );

describe( 'useDownload — a status poll that fails', () => {
	let pollFails = false;
	let failedCalls = 0;
	const running = {
		id: 4321,
		status: 'running',
		progress: 40,
		url: '',
		valid_until: '',
		error: '',
	};

	beforeEach( () => {
		jest.useFakeTimers();
		pollFails = false;
		failedCalls = 0;
		mockedApiFetch.mockImplementation( ( options: { method?: string } ) => {
			if ( options?.method === 'POST' ) {
				return Promise.resolve( { id: 4321 } );
			}
			if ( pollFails ) {
				failedCalls++;
				return Promise.reject( new Error( 'Offline.' ) );
			}
			return Promise.resolve( running );
		} );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

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
	 * Submit and wait for the first good reading.
	 *
	 * @return The rendered hook result.
	 */
	async function startAndReadOnce() {
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );
		await advance( 10 );
		await advance( 10 );
		await advance( 10 );
		expect( result.current.state ).toEqual( { phase: 'progress', percent: 40 } );
		return result;
	}

	it( 'keeps showing progress through one failed poll', async () => {
		const result = await startAndReadOnce();

		pollFails = true;
		await advance( 1500 );

		expect( failedCalls ).toBe( 1 );
		expect( result.current.state ).toEqual( { phase: 'progress', percent: 40 } );
	} );

	it( 'says it is reconnecting after repeated failures, and clears on success', async () => {
		const result = await startAndReadOnce();

		pollFails = true;
		for ( let i = 0; i < 10 && ! ( 'reconnecting' in result.current.state ); i++ ) {
			await advance( 1500 );
		}
		// The note arrives on the third consecutive failure, not before.
		expect( failedCalls ).toBe( 3 );
		expect( result.current.state ).toEqual( {
			phase: 'progress',
			percent: 40,
			reconnecting: true,
		} );

		pollFails = false;
		await advance( 3000 );
		expect( result.current.state ).toEqual( { phase: 'progress', percent: 40 } );
	} );
} );
