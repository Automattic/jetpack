/**
 * Tests for `useCategorySummary` — the unified hook backing every
 * <CategoryCard>. Validates the shape contract `{ blocked, challenged,
 * passed, series, preview, not_active_here }` across all three fetch
 * kinds in `category-config.ts`.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useCategorySummary } from '@/hooks/use-category-summary';
import { __resetApiClientMocks } from '../mocks/api-client';
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

describe( 'useCategorySummary', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error — test cleanup
		delete window.akismetExperimental;
	} );

	describe( 'comments — akismet-stats fetch kind', () => {
		it( 'maps spam → blocked and ham → passed', async () => {
			setMockState( { stats: { '30-days': { spam: 1000, ham: 50 } } } );
			const { result } = renderHook( () => useCategorySummary( 'comments', '30-days' ), {
				wrapper: wrap(),
			} );
			await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
			expect( result.current.data?.blocked ).toBe( 1000 );
			expect( result.current.data?.passed ).toBe( 50 );
			expect( result.current.data?.challenged ).toBe( 0 );
		} );

		it( 'carries preview:true through from the stats mock', async () => {
			const { result } = renderHook( () => useCategorySummary( 'comments', '30-days' ), {
				wrapper: wrap(),
			} );
			await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
			expect( result.current.data?.preview ).toBe( true );
			expect( result.current.data?.not_active_here ).toBe( false );
		} );

		it( 'populates the sparkline series from the time-series mock', async () => {
			const { result } = renderHook( () => useCategorySummary( 'comments', '30-days' ), {
				wrapper: wrap(),
			} );
			await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
			expect( result.current.data?.series.length ).toBeGreaterThan( 0 );
			expect( result.current.data?.series[ 0 ] ).toHaveProperty( 'date' );
			expect( result.current.data?.series[ 0 ] ).toHaveProperty( 'blocked' );
		} );
	} );

	describe( 'logins — blackbox-aggregates fetch kind', () => {
		it( 'passes through blocked / challenged / passed from blackbox aggregates', async () => {
			setMockState( {
				blackboxAggregates: {
					'logins|30-days': { blocked: 200, challenged: 80, passed: 30 },
				},
			} );
			const { result } = renderHook( () => useCategorySummary( 'logins', '30-days' ), {
				wrapper: wrap(),
			} );
			await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
			expect( result.current.data?.blocked ).toBe( 200 );
			expect( result.current.data?.challenged ).toBe( 80 );
			expect( result.current.data?.passed ).toBe( 30 );
		} );

		it( 'sets preview=true when the mock branch is in effect', async () => {
			const { result } = renderHook( () => useCategorySummary( 'bots', '30-days' ), {
				wrapper: wrap(),
			} );
			await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
			expect( result.current.data?.preview ).toBe( true );
		} );
	} );

	describe( 'checkouts — woocommerce-fraud fetch kind', () => {
		it( 'returns not_active_here when WooCommerce is absent', async () => {
			const { result } = renderHook( () => useCategorySummary( 'checkouts', '30-days' ), {
				wrapper: wrap(),
			} );
			await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
			expect( result.current.data?.not_active_here ).toBe( true );
			expect( result.current.data?.blocked ).toBe( 0 );
		} );

		it( 'fetches and exposes WC fraud counts when WC is active', async () => {
			(
				window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } }
			 ).akismetExperimental = {
				integrations: { woocommerce: true },
			};
			const { result } = renderHook( () => useCategorySummary( 'checkouts', '30-days' ), {
				wrapper: wrap(),
			} );
			await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
			expect( result.current.data?.blocked ).toBe( 120 ); // blocked_checkouts default
			expect( result.current.data?.not_active_here ).toBe( false );
		} );
	} );
} );
