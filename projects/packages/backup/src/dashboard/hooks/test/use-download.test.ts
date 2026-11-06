import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { DEFAULT_RESTORE_ITEMS } from '../../types/restore';
import { useDownload, POLL_INTERVAL_MS } from '../use-download';

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

	it( 'says so when the download link has expired', async () => {
		respondWith( {
			id: 4321,
			status: 'expired',
			progress: 0,
			url: '',
			valid_until: '2026-08-20T00:00:00+00:00',
			error: '',
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );

		await waitFor( () =>
			expect( result.current.state ).toMatchObject( {
				phase: 'error',
				message: 'This download has expired.',
			} )
		);
	} );
} );

describe( 'useDownload — a download already under way', () => {
	/**
	 * One download as the bridge projects it.
	 *
	 * @param overrides - Fields that differ from a running download of this backup.
	 * @return The projected download.
	 */
	function row( overrides: Record< string, unknown > = {} ) {
		return {
			id: 77,
			rewind_id: REWIND_ID,
			status: 'running',
			progress: 30,
			url: '',
			valid_until: '',
			error: '',
			...overrides,
		};
	}

	const finished = row( {
		status: 'finished',
		progress: 0,
		url: 'https://example.com/archive.zip',
		valid_until: '2026-08-20T00:00:00+00:00',
	} );

	/**
	 * Answer the downloads list, and each status read with the listed download it names.
	 *
	 * @param downloads - The list, or an error to reject the list with.
	 * @param status    - How to answer a status read instead.
	 */
	function respondWithDownloads(
		downloads: ReturnType< typeof row >[] | Error,
		status: ( id: number ) => Promise< unknown > = id =>
			Promise.resolve(
				( Array.isArray( downloads ) && downloads.find( download => download.id === id ) ) ||
					row( { id, progress: 10 } )
			)
	) {
		mockedApiFetch.mockImplementation( ( options: { path: string; method?: string } ) => {
			if ( options.method === 'POST' ) {
				return Promise.resolve( { id: 4321 } );
			}
			if ( options.path.includes( '/backups/downloads' ) ) {
				return downloads instanceof Error
					? Promise.reject( downloads )
					: Promise.resolve( downloads );
			}
			return status(
				Number( new URL( options.path, 'https://example.com' ).searchParams.get( 'download_id' ) )
			);
		} );
	}

	/**
	 * Every downloads-list request made so far.
	 *
	 * @return The matching apiFetch calls.
	 */
	function listCalls() {
		return mockedApiFetch.mock.calls.filter( ( [ options ] ) =>
			options.path.includes( '/backups/downloads' )
		);
	}

	it( 'offers the form only once it knows no download is under way', async () => {
		respondWithDownloads( [] );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID, true, true ), { wrapper } );

		expect( result.current.state ).toEqual( { phase: 'checking' } );
		await waitFor( () => expect( result.current.state ).toEqual( { phase: 'idle' } ) );
	} );

	it( 'follows the newest download of this backup while it is still being built', async () => {
		respondWithDownloads( [ { ...finished, id: 70 }, row() ] );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID, true, true ), { wrapper } );

		await waitFor( () =>
			expect( result.current.state ).toEqual( { phase: 'progress', percent: 30 } )
		);
		expect( mockedApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( 'download_id=77' ) } )
		);
	} );

	it( 'offers the archive of this backup without waiting for a status read', async () => {
		respondWithDownloads( [ finished ], () => new Promise( () => {} ) );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID, true, true ), { wrapper } );

		await waitFor( () =>
			expect( result.current.state ).toEqual( {
				phase: 'success',
				downloadUrl: 'https://example.com/archive.zip',
				validUntil: '2026-08-20T00:00:00+00:00',
			} )
		);
	} );

	it.each( [
		[ 'of another backup', row( { rewind_id: '1786000000.1' } ) ],
		[ 'expired', row( { status: 'expired', valid_until: '2026-08-20T00:00:00+00:00' } ) ],
		[ 'failed', row( { status: 'failed', error: 'Archive expired' } ) ],
	] )( 'offers the form when the latest download is %s', async ( _label, latest ) => {
		respondWithDownloads( [ latest ] );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID, true, true ), { wrapper } );

		await waitFor( () => expect( listCalls() ).toHaveLength( 1 ) );
		await waitFor( () => expect( result.current.state ).toEqual( { phase: 'idle' } ) );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	// With production's one retry, so a failed lookup cannot hold the form back for the retry delay.
	it( 'offers the form as soon as the lookup fails', async () => {
		respondWithDownloads( new Error( 'Offline.' ) );
		const client = new QueryClient( { defaultOptions: { queries: { retry: 1 } } } );
		const wrapper = ( { children }: { children: ReactNode } ) =>
			createElement( QueryClientProvider, { client }, children );

		const { result } = renderHook( () => useDownload( REWIND_ID, true, true ), { wrapper } );

		await waitFor( () => expect( result.current.state ).toEqual( { phase: 'idle' } ), {
			timeout: 500,
		} );
		expect( listCalls() ).toHaveLength( 1 );
	} );

	it( 'does not look for one when resuming is off', async () => {
		respondWithDownloads( [ row() ] );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useDownload( REWIND_ID, true, false ), { wrapper } );

		expect( result.current.state ).toEqual( { phase: 'idle' } );
		expect( listCalls() ).toHaveLength( 0 );
	} );

	it( 'returns to the form for good after a reset', async () => {
		respondWithDownloads( [ finished ] );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useDownload( REWIND_ID, true, true ), { wrapper } );
		await waitFor( () => expect( result.current.state.phase ).toBe( 'success' ) );

		act( () => result.current.reset() );

		expect( result.current.state ).toEqual( { phase: 'idle' } );
	} );

	it( 'starts a new download from a ready one', async () => {
		respondWithDownloads( [ finished ] );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useDownload( REWIND_ID, true, true ), { wrapper } );
		await waitFor( () => expect( result.current.state.phase ).toBe( 'success' ) );

		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );

		expect( result.current.state ).toEqual( { phase: 'submitting' } );
		await waitFor( () =>
			expect( result.current.state ).toEqual( { phase: 'progress', percent: 10 } )
		);
	} );
} );

describe( 'useDownload — a status poll that fails', () => {
	let pollFails = false;
	let pollStatus: number | null = null;
	let pollDone = false;
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
		pollStatus = null;
		pollDone = false;
		failedCalls = 0;
		mockedApiFetch.mockImplementation( ( options: { method?: string } ) => {
			if ( options?.method === 'POST' ) {
				return Promise.resolve( { id: 4321 } );
			}
			if ( pollStatus !== null ) {
				failedCalls++;
				return Promise.reject( {
					code: 'download_status_fetch_failed',
					message: 'Could not fetch download status.',
					data: { status: pollStatus },
				} );
			}
			if ( pollFails ) {
				failedCalls++;
				return Promise.reject( new Error( 'Offline.' ) );
			}
			return Promise.resolve(
				pollDone
					? { ...running, status: 'finished', url: 'https://example.com/a.zip', valid_until: 'x' }
					: running
			);
		} );
	} );

	afterEach( () => {
		focusManager.setFocused( true );
		jest.useRealTimers();
	} );

	/**
	 * Advance fake timers inside `act`, letting queued promises settle.
	 *
	 * @param ms - How far to advance.
	 */
	async function advance( ms: number ) {
		// Advance in small steps (POLL_INTERVAL_MS). Longer steps never give React 19 a gap between updates, so it throws "Maximum update depth exceeded".
		while ( ms > 0 ) {
			await act( async () => {
				await jest.advanceTimersByTimeAsync( Math.min( ms, POLL_INTERVAL_MS ) );
			} );
			ms -= POLL_INTERVAL_MS;
		}
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

	it( 'keeps polling and never errors when the first reads fail', async () => {
		pollFails = true;
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );

		for ( let i = 0; i < 10 && ! ( 'reconnecting' in result.current.state ); i++ ) {
			await advance( 1500 );
			expect( result.current.state.phase ).toBe( 'progress' );
		}
		expect( failedCalls ).toBeGreaterThanOrEqual( 3 );
		expect( result.current.state ).toEqual( {
			phase: 'progress',
			percent: 0,
			reconnecting: true,
		} );

		pollFails = false;
		await advance( 3000 );
		expect( result.current.state ).toEqual( { phase: 'progress', percent: 40 } );
	} );

	// Production retries a failed read once, so one failed poll is two calls.
	it( 'counts a poll as one failure after its retry', async () => {
		const client = new QueryClient( {
			defaultOptions: { queries: { retry: 1 }, mutations: { retry: false } },
		} );
		const wrapper = ( { children }: { children: ReactNode } ) =>
			createElement( QueryClientProvider, { client }, children );
		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );
		await advance( 10 );
		await advance( 10 );
		await advance( 10 );
		expect( result.current.state ).toEqual( { phase: 'progress', percent: 40 } );

		pollFails = true;
		for ( let i = 0; i < 20 && ! ( 'reconnecting' in result.current.state ); i++ ) {
			await advance( 1500 );
		}
		expect( failedCalls ).toBe( 6 );
	} );

	it( 'shows the error at once and stops polling on a 4xx', async () => {
		const result = await startAndReadOnce();

		pollStatus = 404;
		await advance( 1500 );
		await advance( 1500 );
		expect( result.current.state ).toMatchObject( {
			phase: 'error',
			message: 'Could not fetch download status.',
		} );

		const calls = mockedApiFetch.mock.calls.length;
		await advance( 10_000 );
		expect( mockedApiFetch.mock.calls ).toHaveLength( calls );
	} );

	/**
	 * Count the status requests made while `ms` of fake time passes.
	 *
	 * @param ms - How far to advance.
	 * @return The number of status requests in that window.
	 */
	async function pollsDuring( ms: number ) {
		const before = mockedApiFetch.mock.calls.length;
		await advance( ms );
		return mockedApiFetch.mock.calls.length - before;
	}

	it( 'polls less often as a download runs long, up to a cap', async () => {
		await startAndReadOnce();

		// Each window is 30s long, sampled at about 0s, 2min and 10min in.
		// Expect the 1.5s, 5s and 15s intervals.
		const early = await pollsDuring( 30_000 );
		await advance( 90_000 );
		const middle = await pollsDuring( 30_000 );
		await advance( 450_000 );
		const late = await pollsDuring( 30_000 );

		expect( [ early, middle, late ] ).toEqual( [ 20, 6, 2 ] );
	} );

	it( 'reads the status at once when a hidden tab regains focus', async () => {
		// Like the shared client, which turns focus refetching off.
		const client = new QueryClient( {
			defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
		} );
		const wrapper = ( { children }: { children: ReactNode } ) =>
			createElement( QueryClientProvider, { client }, children );
		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );
		await advance( 30 );

		act( () => focusManager.setFocused( false ) );
		await advance( 20_000 );
		const before = mockedApiFetch.mock.calls.length;
		await act( async () => focusManager.setFocused( true ) );

		expect( mockedApiFetch.mock.calls.length ).toBeGreaterThan( before );
	} );

	it( 'backs off when the polls never succeed', async () => {
		pollFails = true;
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );
		await advance( 30 );
		await advance( 600_000 );

		await expect( pollsDuring( 30_000 ) ).resolves.toBe( 2 );
	} );

	it.each( [
		[ 'finished', 'done' ],
		[ 'refused with a 4xx', 404 ],
	] )( 'does not read the status on refocus once the download is %s', async ( _label, outcome ) => {
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useDownload( REWIND_ID ), { wrapper } );
		act( () => result.current.submit( DEFAULT_RESTORE_ITEMS ) );
		await advance( 30 );
		if ( outcome === 'done' ) {
			pollDone = true;
		} else {
			pollStatus = 404;
		}
		await advance( 3000 );
		expect( [ 'success', 'error' ] ).toContain( result.current.state.phase );

		const before = mockedApiFetch.mock.calls.length;
		act( () => focusManager.setFocused( false ) );
		await act( async () => focusManager.setFocused( true ) );

		expect( mockedApiFetch.mock.calls ).toHaveLength( before );
	} );

	it( 'treats a 502 as temporary', async () => {
		const result = await startAndReadOnce();

		pollStatus = 502;
		for ( let i = 0; i < 10 && ! ( 'reconnecting' in result.current.state ); i++ ) {
			await advance( 1500 );
			expect( result.current.state.phase ).toBe( 'progress' );
		}
		expect( result.current.state ).toMatchObject( { phase: 'progress', reconnecting: true } );
	} );
} );
