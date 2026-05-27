/**
 * Tests for `useApiKey` — the thin TanStack wrapper over `apiKeyQuery()`.
 *
 * Mocks at the `apiClient` boundary (conventions doc §11). The defaults wired
 * in `tests/js/mocks/api-client.ts` read from `getMockState()`; failure cases
 * use `mockRejectedValueOnce` per-call.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiKey } from '@/hooks/use-api-key';
import { apiClient, __resetApiClientMocks } from '../mocks/api-client';
import { setMockState } from '../mocks/handlers';
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

describe( 'useApiKey', () => {
	beforeEach( () => __resetApiClientMocks() );

	it( 'returns the empty key when none is set', async () => {
		const { result } = renderHook( () => useApiKey(), { wrapper: wrap() } );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( result.current.data ).toEqual( { key: '', valid: false } );
		expect( apiClient.get ).toHaveBeenCalledWith( 'key' );
	} );

	it( 'returns the populated key after one is set', async () => {
		setMockState( { key: 'abcdef123456', keyValid: true } );
		const { result } = renderHook( () => useApiKey(), { wrapper: wrap() } );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( result.current.data ).toEqual( { key: 'abcdef123456', valid: true } );
	} );

	it( 'types errors as WpError — consumer can branch on error.code', async () => {
		( apiClient.get as jest.Mock ).mockRejectedValueOnce( {
			code: 'akismet_unavailable',
			message: 'service down',
			data: { status: 503 },
		} );
		const { result } = renderHook( () => useApiKey(), { wrapper: wrap() } );
		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.error?.code ).toBe( 'akismet_unavailable' );
	} );
} );
