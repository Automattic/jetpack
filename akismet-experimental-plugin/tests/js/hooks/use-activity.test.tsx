/**
 * Tests for `useActivity` + `useBlackboxRowVerdict` — Plan 3 hooks.
 *
 * Mocks at the apiClient boundary (conventions §11 / Plan 2 Trap #2 —
 * the jest-mock pattern continues from Plan 2; MSW deferred).
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivity } from '@/hooks/use-activity';
import { useBlackboxRowVerdict } from '@/hooks/use-blackbox-row-verdict';
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

const allParams = {
	page: 1,
	perPage: 25,
	category: 'all' as const,
	outcome: 'all' as const,
	source: 'all' as const,
	search: '',
};

describe( 'useActivity', () => {
	beforeEach( () => __resetApiClientMocks() );

	it( 'fetches the all-category page', async () => {
		const { result } = renderHook( () => useActivity( allParams ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( apiClient.get ).toHaveBeenCalledWith( expect.stringMatching( /^activity\?/ ) );
		expect( result.current.data?.items.length ).toBeGreaterThan( 0 );
		expect( result.current.data?.total ).toBeGreaterThan( 0 );
	} );

	it( 'narrows results when category is set', async () => {
		const { result } = renderHook( () => useActivity( { ...allParams, category: 'logins' } ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		for ( const row of result.current.data?.items ?? [] ) {
			expect( row.category ).toBe( 'logins' );
		}
	} );

	it( 'narrows by outcome across categories', async () => {
		const { result } = renderHook( () => useActivity( { ...allParams, outcome: 'block' } ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		for ( const row of result.current.data?.items ?? [] ) {
			expect( row.outcome ).toBe( 'block' );
		}
	} );

	it( 'paginates — page 2 contains rows not on page 1', async () => {
		const { result: page1 } = renderHook( () => useActivity( allParams ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( page1.current.isSuccess ).toBe( true ) );

		const { result: page2 } = renderHook( () => useActivity( { ...allParams, page: 2 } ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( page2.current.isSuccess ).toBe( true ) );

		const idsOnPage1 = new Set( ( page1.current.data?.items ?? [] ).map( r => r.id ) );
		const overlap = ( page2.current.data?.items ?? [] ).filter( r => idsOnPage1.has( r.id ) );
		expect( overlap ).toHaveLength( 0 );
	} );

	it( 'search filter matches subject label', async () => {
		const { result } = renderHook(
			() =>
				useActivity( {
					...allParams,
					category: 'forms',
					search: 'submission',
				} ),
			{ wrapper: wrap() }
		);
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( result.current.data?.total ).toBeGreaterThan( 0 );
	} );
} );

describe( 'useBlackboxRowVerdict', () => {
	beforeEach( () => __resetApiClientMocks() );

	it( 'does not fetch when sessionId is null/undefined', async () => {
		const { result } = renderHook( () => useBlackboxRowVerdict( null ), { wrapper: wrap() } );
		await new Promise( r => setTimeout( r, 10 ) );
		expect( result.current.fetchStatus ).toBe( 'idle' );
		expect( apiClient.get ).not.toHaveBeenCalled();
	} );

	it( 'fetches when a session id is provided', async () => {
		const { result } = renderHook( () => useBlackboxRowVerdict( 'sess_abc_123' ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( apiClient.get ).toHaveBeenCalledWith( 'blackbox/verdict/sess_abc_123' );
		expect( result.current.data?.session_id ).toBe( 'sess_abc_123' );
		expect( result.current.data?.preview ).toBe( true );
	} );

	it( 'honors per-session override (decision)', async () => {
		setMockState( {
			blackboxVerdicts: {
				sess_force_block: { decision: 'block', preview: false },
			},
		} );
		const { result } = renderHook( () => useBlackboxRowVerdict( 'sess_force_block' ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( result.current.data?.decision ).toBe( 'block' );
		expect( result.current.data?.preview ).toBe( false );
	} );
} );
