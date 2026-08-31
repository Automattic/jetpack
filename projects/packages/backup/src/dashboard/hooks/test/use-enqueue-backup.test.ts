import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { useEnqueueBackup } from '../use-enqueue-backup';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Fresh client per test, with retries off so a failure assertion doesn't
 * wait out react-query's backoff.
 *
 * @return A wrapper providing an isolated QueryClient.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper };
}

beforeEach( () => {
	mockedApiFetch.mockReset();
} );

describe( 'useEnqueueBackup', () => {
	it( 'reports success when WPCOM accepts the request', async () => {
		mockedApiFetch.mockResolvedValue( { success: true } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useEnqueueBackup(), { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'enqueued' ) );
		expect( mockedApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: '/jetpack/v4/site/backup/enqueue', method: 'POST' } )
		);
	} );

	// `enqueue_backup()` returns bare `null` for a WPCOM reply it cannot
	// decode, which WordPress serves as HTTP 200 — so the request
	// resolves and nothing throws. The legacy button discards the body,
	// so it still reports "Backup enqueued" and then polls for a backup
	// that was never queued.
	it( 'reports a null body as a failure, not a success', async () => {
		mockedApiFetch.mockResolvedValue( null );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useEnqueueBackup(), { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );
		expect( result.current.errorMessage ).toBe( 'Could not start a backup. Please try again.' );
	} );

	it( 'surfaces the reason when WPCOM refuses inside a 200', async () => {
		mockedApiFetch.mockResolvedValue( { success: false, error: 'Backups are not enabled.' } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useEnqueueBackup(), { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );
		expect( result.current.errorMessage ).toBe( 'Backups are not enabled.' );
	} );

	it( 'reports a rejected request as a failure', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'rest_forbidden',
			message: 'Sorry, you are not allowed.',
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useEnqueueBackup(), { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );
		expect( result.current.errorMessage ).toBe( 'Sorry, you are not allowed.' );
	} );

	it( 'invalidates the backups query so the list starts reflecting the new backup', async () => {
		mockedApiFetch.mockResolvedValue( { success: true } );
		const { client, wrapper } = makeWrapper();
		const invalidate = jest.spyOn( client, 'invalidateQueries' );

		const { result } = renderHook( () => useEnqueueBackup(), { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'enqueued' ) );
		expect( invalidate ).toHaveBeenCalledWith( { queryKey: [ 'backup', 'backups' ] } );
	} );

	it( 'goes back to idle on reset, so the button can be tried again', async () => {
		mockedApiFetch.mockResolvedValue( null );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useEnqueueBackup(), { wrapper } );
		act( () => result.current.enqueue() );
		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );

		act( () => result.current.reset() );

		await waitFor( () => expect( result.current.state ).toBe( 'idle' ) );
		expect( result.current.errorMessage ).toBeNull();
	} );
} );
