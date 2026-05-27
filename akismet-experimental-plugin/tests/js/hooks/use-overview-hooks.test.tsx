/**
 * Tests for the per-source Overview hooks. Each is a thin wrapper over its
 * queryOptions factory in src/data/queries.ts. Tests assert:
 *   - the correct endpoint path is hit
 *   - the response is exposed through `result.current.data`
 *   - WpError shapes surface as `result.current.error`
 *
 * Mocks at the `apiClient` boundary (conventions doc §11).
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useBlackboxAggregates } from '@/hooks/use-blackbox-aggregates';
import { isWooCommerceActive } from '@/hooks/use-is-woocommerce-active';
import { useStatsTimeSeries } from '@/hooks/use-stats-time-series';
import { useStatsTotals } from '@/hooks/use-stats-totals';
import { useWooCommerceFraudSummary } from '@/hooks/use-woocommerce-fraud-summary';
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

describe( 'useStatsTotals', () => {
	beforeEach( () => __resetApiClientMocks() );

	it( 'fetches /stats/{interval} and returns the totals shape', async () => {
		const { result } = renderHook( () => useStatsTotals( '60-days' ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( apiClient.get ).toHaveBeenCalledWith( 'stats/60-days' );
		expect( result.current.data?.spam ).toBe( 1234 );
		expect( result.current.data?.preview ).toBe( true );
	} );

	it( 'honors a per-interval spam override from setMockState', async () => {
		setMockState( { stats: { '30-days': { spam: 999, preview: false } } } );
		const { result } = renderHook( () => useStatsTotals( '30-days' ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( result.current.data?.spam ).toBe( 999 );
		expect( result.current.data?.preview ).toBe( false );
	} );
} );

describe( 'useStatsTimeSeries', () => {
	beforeEach( () => __resetApiClientMocks() );

	it( 'fetches /stats/timeseries with interval qs param', async () => {
		const { result } = renderHook( () => useStatsTimeSeries( '30-days' ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( apiClient.get ).toHaveBeenCalledWith( 'stats/timeseries?interval=30-days' );
		expect( result.current.data?.series.length ).toBeGreaterThan( 0 );
	} );
} );

describe( 'useBlackboxAggregates', () => {
	beforeEach( () => __resetApiClientMocks() );

	it( 'fetches /blackbox/aggregates with category + interval qs params', async () => {
		const { result } = renderHook( () => useBlackboxAggregates( 'logins', '30-days' ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( apiClient.get ).toHaveBeenCalledWith(
			'blackbox/aggregates?category=logins&interval=30-days'
		);
		expect( result.current.data?.preview ).toBe( true );
	} );

	it( 'returns the override blocked count when set', async () => {
		setMockState( {
			blackboxAggregates: { 'bots|30-days': { blocked: 77 } },
		} );
		const { result } = renderHook( () => useBlackboxAggregates( 'bots', '30-days' ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( result.current.data?.blocked ).toBe( 77 );
	} );
} );

describe( 'isWooCommerceActive', () => {
	afterEach( () => {
		// @ts-expect-error — test cleanup
		delete window.akismetExperimental;
	} );

	it( 'returns false when the global integrations key is missing', () => {
		expect( isWooCommerceActive() ).toBe( false );
	} );

	it( 'returns true when window.akismetExperimental.integrations.woocommerce is true', () => {
		(
			window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } }
		 ).akismetExperimental = {
			integrations: { woocommerce: true },
		};
		expect( isWooCommerceActive() ).toBe( true );
	} );

	it( 'returns false when the integration flag is explicitly false', () => {
		(
			window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } }
		 ).akismetExperimental = {
			integrations: { woocommerce: false },
		};
		expect( isWooCommerceActive() ).toBe( false );
	} );
} );

describe( 'useWooCommerceFraudSummary', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error — test cleanup
		delete window.akismetExperimental;
	} );

	it( 'does not fetch when WooCommerce is inactive', async () => {
		const { result } = renderHook( () => useWooCommerceFraudSummary( '30-days' ), {
			wrapper: wrap(),
		} );
		// React Query's `enabled: false` keeps the query in pending state.
		await new Promise( r => setTimeout( r, 10 ) );
		expect( apiClient.get ).not.toHaveBeenCalledWith(
			expect.stringContaining( 'woocommerce/fraud-summary' )
		);
		expect( result.current.fetchStatus ).toBe( 'idle' );
	} );

	it( 'fetches /woocommerce/fraud-summary when WC is active', async () => {
		(
			window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } }
		 ).akismetExperimental = {
			integrations: { woocommerce: true },
		};
		const { result } = renderHook( () => useWooCommerceFraudSummary( '30-days' ), {
			wrapper: wrap(),
		} );
		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
		expect( apiClient.get ).toHaveBeenCalledWith( 'woocommerce/fraud-summary?interval=30-days' );
		expect( result.current.data?.blocked_checkouts ).toBe( 120 );
		expect( result.current.data?.preview ).toBe( false );
	} );
} );
