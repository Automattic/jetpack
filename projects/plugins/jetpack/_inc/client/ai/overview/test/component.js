import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { normalizeUsage, useAiUsage } from '../use-ai-usage';
import { freePayload, tieredPayload } from './fixtures';

// The hook fetches through @wordpress/api-fetch; stub it so nothing hits the
// network and each test controls the response.
jest.mock( '@wordpress/api-fetch' );

afterEach( () => {
	jest.resetAllMocks();
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
		expect( usage.planLabel ).toBe( '500' );
	} );

	test( 'over the limit: available never goes negative', () => {
		const usage = normalizeUsage( { ...freePayload(), 'requests-count': 25 } );

		expect( usage.requestsAvailable ).toBe( 0 );
	} );

	test( 'legacy unlimited: no numbers, an Unlimited plan label, a renewal date, no upgrade', () => {
		const usage = normalizeUsage( {
			...tieredPayload(),
			'current-tier': { value: 1 },
		} );

		expect( usage.unlimited ).toBe( true );
		expect( usage.requestsCount ).toBeNull();
		expect( usage.requestsLimit ).toBeNull();
		expect( usage.requestsAvailable ).toBeNull();
		// The payload has no product name (the design shows one, e.g.
		// "Complete"), so the label falls back to the plan's nature.
		expect( usage.planLabel ).toBe( 'Unlimited' );
		expect( usage.renewsOn ).toBe( '2026-09-01' );
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

	test( 'missing data: nulls, never NaN', () => {
		for ( const usage of [ normalizeUsage( {} ), normalizeUsage( undefined ) ] ) {
			expect( usage.requestsCount ).toBeNull();
			expect( usage.requestsLimit ).toBeNull();
			expect( usage.requestsAvailable ).toBeNull();
			expect( usage.renewsOn ).toBeNull();
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
