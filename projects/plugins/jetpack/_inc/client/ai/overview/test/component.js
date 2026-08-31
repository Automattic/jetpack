import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { anchorDateToUtc, normalizeUsage, useAiUsage } from '../use-ai-usage';
import { freePayload, tieredPayload, unlimitedPayload } from './fixtures';

// The hook fetches through @wordpress/api-fetch; stub it so nothing hits the
// network and each test controls the response.
jest.mock( '@wordpress/api-fetch' );

afterEach( () => {
	jest.resetAllMocks();
} );

describe( 'anchorDateToUtc', () => {
	test( 'pins the naive shapes the endpoint actually sends', () => {
		// The live payload sends a bare calendar date; parsing it in the
		// browser timezone shows the previous day east of UTC.
		expect( anchorDateToUtc( '2026-09-01' ) ).toBe( '2026-09-01T00:00:00+00:00' );
		expect( anchorDateToUtc( '2026-09-01 00:00:00' ) ).toBe( '2026-09-01T00:00:00+00:00' );
	} );

	test( 'leaves values that already carry timezone information alone', () => {
		expect( anchorDateToUtc( '2026-09-01T00:00:00+00:00' ) ).toBe( '2026-09-01T00:00:00+00:00' );
		expect( anchorDateToUtc( '2026-09-01T00:00:00Z' ) ).toBe( '2026-09-01T00:00:00Z' );
		expect( anchorDateToUtc( '2026-09-01T10:00:00-04:00' ) ).toBe( '2026-09-01T10:00:00-04:00' );
	} );

	test( 'passes anything it does not positively recognize through untouched', () => {
		// A mangled anchor would render "Invalid date"; unrecognized shapes and
		// non-strings must come back exactly as they went in.
		expect( anchorDateToUtc( '2026-09-01T00:00:00+00' ) ).toBe( '2026-09-01T00:00:00+00' );
		expect( anchorDateToUtc( '2026-09-01 00:00:00 UTC' ) ).toBe( '2026-09-01 00:00:00 UTC' );
		expect( anchorDateToUtc( 'garbage' ) ).toBe( 'garbage' );
		expect( anchorDateToUtc( 42 ) ).toBe( 42 );
		expect( anchorDateToUtc( null ) ).toBeNull();
	} );
} );

describe( 'normalizeUsage', () => {
	test( 'free tier: counts remaining requests against the free limit and offers upgrade', () => {
		const usage = normalizeUsage( freePayload() );

		expect( usage.unlimited ).toBe( false );
		expect( usage.planLabel ).toBe( 'Free' );
		expect( usage.requestsCount ).toBe( 12 );
		expect( usage.requestsLimit ).toBe( 20 );
		expect( usage.requestsAvailable ).toBe( 8 );
		expect( usage.planLabel ).toBe( 'Free' );
		expect( usage.showUpgrade ).toBe( true );
	} );

	test( 'tiered plan: counts remaining period requests against the tier limit', () => {
		const usage = normalizeUsage( tieredPayload() );

		expect( usage.unlimited ).toBe( false );

		expect( usage.requestsCount ).toBe( 340 );
		expect( usage.requestsLimit ).toBe( 500 );
		expect( usage.requestsAvailable ).toBe( 160 );
		// The tier limit is not a plan name — it already shows on the meter.
		expect( usage.planLabel ).toBeNull();
	} );

	test( 'over the limit: available never goes negative', () => {
		const usage = normalizeUsage( { ...freePayload(), 'requests-count': 25 } );

		expect( usage.requestsAvailable ).toBe( 0 );
	} );

	test( 'unlimited: no numbers, no derived plan label, no upgrade', () => {
		const usage = normalizeUsage( unlimitedPayload() );

		expect( usage.unlimited ).toBe( true );
		expect( usage.requestsCount ).toBeNull();
		expect( usage.requestsLimit ).toBeNull();
		expect( usage.requestsAvailable ).toBeNull();
		// The card falls back to the period's real usage on this tier.
		expect( usage.periodRequestsCount ).toBe( 340 );
		// The plan name can only come from the purchase; "Unlimited" would
		// just repeat the requests cell.
		expect( usage.planLabel ).toBeNull();
		expect( usage.showUpgrade ).toBe( false );
	} );

	test( 'top tier: no next tier and no required upgrade means no upgrade', () => {
		const usage = normalizeUsage( {
			...tieredPayload(),
			'next-tier': null,
			'site-require-upgrade': false,
		} );

		expect( usage.showUpgrade ).toBe( false );
	} );

	test( 'free: keeps the upgrade even when the payload carries no next tier', () => {
		// next-tier is nullable on the wire; free is upgradable by definition.
		const usage = normalizeUsage( { ...freePayload(), 'next-tier': null } );

		expect( usage.isFree ).toBe( true );
		expect( usage.showUpgrade ).toBe( true );
	} );

	test( 'missing current-tier: reads the free-shape pair, not period count against the free limit', () => {
		const payload = tieredPayload();
		delete payload[ 'current-tier' ];
		const usage = normalizeUsage( payload );

		// 950 used of 20 floors at 0 available — but the pair is consistent,
		// not the usage-period count charged against an unrelated limit.
		expect( usage.requestsCount ).toBe( 950 );
		expect( usage.requestsLimit ).toBe( 20 );
	} );

	test( 'missing data: nulls, never NaN', () => {
		for ( const usage of [ normalizeUsage( {} ), normalizeUsage( undefined ) ] ) {
			expect( usage.requestsCount ).toBeNull();
			expect( usage.requestsLimit ).toBeNull();
			expect( usage.requestsAvailable ).toBeNull();
			expect( usage.periodRequestsCount ).toBeNull();
			expect( usage.unlimited ).toBe( false );
			expect( usage.showUpgrade ).toBe( false );
			expect( usage.planLabel ).toBeNull();
		}
	} );
} );

describe( 'useAiUsage', () => {
	test( 'load: exposes the payload and clears loading', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		const { result } = renderHook( () => useAiUsage() );

		expect( result.current.isLoading ).toBe( true );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.data ).toEqual( freePayload() );
		expect( result.current.error ).toBeNull();
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/jetpack-ai/ai-assistant-feature',
		} );
	} );

	test( 'load failure: surfaces the error message and clears loading', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'Unable to fetch the requested data.' ) );

		const { result } = renderHook( () => useAiUsage() );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.error ).toBe( 'Unable to fetch the requested data.' );
		expect( result.current.data ).toBeNull();
	} );
} );
