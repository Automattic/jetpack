/**
 * Tests for `useAkismetConfig` — the query + mutation pair for `/akismet/v1/settings`.
 *
 * Pattern A (conventions §6): the PUT response IS the new settings state, so
 * `onSuccess` calls `setQueryData` directly — no refetch round-trip. These
 * tests prove that contract end-to-end: mutate → cache reflects the change
 * without a second GET.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAkismetConfig } from '@/hooks/use-akismet-config';
import { apiClient, __resetApiClientMocks } from '../mocks/api-client';
import { createTestQueryClient } from '../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../mocks/api-client' ) );

/**
 * Build a fresh QueryClient + provider wrapper for each test.
 *
 * @return Wrapper component for renderHook.
 */
function wrap() {
	const client = createTestQueryClient();
	return ( { children }: { children: ReactNode } ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
}

/**
 * Toggle the `allowMutations` flag for the duration of a test. Returns a
 * cleanup function — call from `afterEach` to restore the default state.
 *
 * @param value - Value to set on `window.akismetExperimental.allowMutations`.
 * @return Cleanup function.
 */
function withAllowMutations( value: boolean ): () => void {
	(
		window as unknown as { akismetExperimental: { allowMutations: boolean } }
	 ).akismetExperimental = { allowMutations: value };
	return () => {
		// @ts-expect-error - cleanup
		delete window.akismetExperimental;
	};
}

describe( 'useAkismetConfig', () => {
	let restore: () => void = () => {};

	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => restore() );

	it( 'reads the current settings on mount', async () => {
		const { result } = renderHook( () => useAkismetConfig(), { wrapper: wrap() } );
		await waitFor( () => expect( result.current.config.isSuccess ).toBe( true ) );
		expect( result.current.config.data ).toEqual( {
			akismet_strictness: '0',
			akismet_show_user_comments_approved: '0',
		} );
	} );

	it( 'persists a patch via setQueryData with no follow-up GET (Pattern A)', async () => {
		restore = withAllowMutations( true );
		const { result } = renderHook( () => useAkismetConfig(), { wrapper: wrap() } );
		await waitFor( () => expect( result.current.config.isSuccess ).toBe( true ) );
		expect( apiClient.get ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			await result.current.update.mutateAsync( { akismet_strictness: '1' } );
		} );

		await waitFor( () => expect( result.current.config.data?.akismet_strictness ).toBe( '1' ) );
		// Pattern A's whole point: setQueryData makes the second GET unnecessary.
		expect( apiClient.get ).toHaveBeenCalledTimes( 1 );
		expect( apiClient.put ).toHaveBeenCalledWith( 'settings', { akismet_strictness: '1' } );
	} );

	it( 'short-circuits when allowMutations() is false (Option A guardrail)', async () => {
		// Default sandbox state: AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS undefined.
		const { result } = renderHook( () => useAkismetConfig(), { wrapper: wrap() } );
		await waitFor( () => expect( result.current.config.isSuccess ).toBe( true ) );

		let caught: { code?: string } | undefined;
		await act( async () => {
			try {
				await result.current.update.mutateAsync( { akismet_strictness: '1' } );
			} catch ( err ) {
				caught = err as { code?: string };
			}
		} );

		expect( caught?.code ).toBe( 'preview_mode_active' );
		// The PUT never reached the wire — defense in depth alongside the PHP gate.
		expect( apiClient.put ).not.toHaveBeenCalled();
		// Cache value is unchanged.
		expect( result.current.config.data?.akismet_strictness ).toBe( '0' );
	} );

	it( 'allows mutation when AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS is set', async () => {
		restore = withAllowMutations( true );
		const { result } = renderHook( () => useAkismetConfig(), { wrapper: wrap() } );
		await waitFor( () => expect( result.current.config.isSuccess ).toBe( true ) );
		await act( async () => {
			await result.current.update.mutateAsync( { akismet_show_user_comments_approved: '1' } );
		} );
		await waitFor( () =>
			expect( result.current.config.data?.akismet_show_user_comments_approved ).toBe( '1' )
		);
	} );
} );
