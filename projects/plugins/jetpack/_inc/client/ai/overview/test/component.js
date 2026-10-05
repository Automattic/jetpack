import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { anchorDateToUtc, normalizeUsage, useAiUsage } from '../use-ai-usage';
import { freePayload, paidPayload, tieredPayload } from './fixtures';

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

		expect( usage.isFree ).toBe( true );
		expect( usage.requestsCount ).toBe( 12 );
		expect( usage.requestsLimit ).toBe( 20 );
		expect( usage.requestsAvailable ).toBe( 8 );
		expect( usage.showUpgrade ).toBe( true );
	} );

	test( 'over the limit: available never goes negative', () => {
		const usage = normalizeUsage( { ...freePayload(), 'requests-count': 25 } );

		expect( usage.requestsAvailable ).toBe( 0 );
	} );

	test( 'paid: no numbers, no upgrade', () => {
		const usage = normalizeUsage( paidPayload() );

		expect( usage.isFree ).toBe( false );
		expect( usage.requestsCount ).toBeNull();
		expect( usage.requestsLimit ).toBeNull();
		expect( usage.requestsAvailable ).toBeNull();
		expect( usage.showUpgrade ).toBe( false );
	} );

	test( 'fixed tier: treated as paid — no numbers, no upgrade', () => {
		const usage = normalizeUsage( tieredPayload() );

		expect( usage.isFree ).toBe( false );
		expect( usage.requestsAvailable ).toBeNull();
		expect( usage.showUpgrade ).toBe( false );
	} );

	test( 'free: keeps the upgrade even when the payload carries no next tier', () => {
		// next-tier is nullable on the wire; free is upgradable by definition.
		const usage = normalizeUsage( { ...freePayload(), 'next-tier': null } );

		expect( usage.isFree ).toBe( true );
		expect( usage.showUpgrade ).toBe( true );
	} );

	test( 'missing current-tier: not confirmably free, so no numbers and no upgrade', () => {
		const payload = paidPayload();
		delete payload[ 'current-tier' ];
		const usage = normalizeUsage( payload );

		expect( usage.isFree ).toBe( false );
		expect( usage.requestsAvailable ).toBeNull();
		expect( usage.showUpgrade ).toBe( false );
	} );

	test( 'missing data: nulls, never NaN', () => {
		for ( const usage of [ normalizeUsage( {} ), normalizeUsage( undefined ) ] ) {
			expect( usage.requestsCount ).toBeNull();
			expect( usage.requestsLimit ).toBeNull();
			expect( usage.requestsAvailable ).toBeNull();
			expect( usage.showUpgrade ).toBe( false );
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
