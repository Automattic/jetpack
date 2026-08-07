import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { normalizeUsage, useAiUsage } from '../use-ai-usage';

// The hook fetches through @wordpress/api-fetch; stub it so nothing hits the
// network and each test controls the response.
jest.mock( '@wordpress/api-fetch' );

afterEach( () => {
	jest.resetAllMocks();
} );

// Payload shapes mirror the wpcom/v2/jetpack-ai/ai-assistant-feature response
// (dash-cased keys, straight from the WPCOM usage helper).
const freePayload = () => ( {
	'has-feature': false,
	'requests-count': 12,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 3, 'next-start': '2026-09-01' },
	'current-tier': { value: 0, limit: 20 },
	'next-tier': { value: 100, limit: 100 },
} );

const tieredPayload = () => ( {
	'has-feature': true,
	'requests-count': 950,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 340, 'next-start': '2026-09-01' },
	'current-tier': { value: 500, limit: 500, readableLimit: '500' },
	'next-tier': { value: 750, limit: 750 },
} );

describe( 'normalizeUsage', () => {
	test( 'free tier: counts remaining requests against the free limit and offers upgrade', () => {
		const usage = normalizeUsage( freePayload() );

		expect( usage.unlimited ).toBe( false );
		expect( usage.isFree ).toBe( true );
		expect( usage.requestsCount ).toBe( 12 );
		expect( usage.requestsLimit ).toBe( 20 );
		expect( usage.requestsAvailable ).toBe( 8 );
		expect( usage.planLabel ).toBe( 'Free' );
		expect( usage.showUpgrade ).toBe( true );
	} );

	test( 'tiered plan: counts remaining period requests against the tier limit', () => {
		const usage = normalizeUsage( tieredPayload() );

		expect( usage.unlimited ).toBe( false );
		expect( usage.isFree ).toBe( false );
		expect( usage.requestsCount ).toBe( 340 );
		expect( usage.requestsLimit ).toBe( 500 );
		expect( usage.requestsAvailable ).toBe( 160 );
		expect( usage.planLabel ).toBe( '500' );
	} );

	test( 'over the limit: available never goes negative', () => {
		const usage = normalizeUsage( { ...freePayload(), 'requests-count': 25 } );

		expect( usage.requestsAvailable ).toBe( 0 );
	} );

	test( 'legacy unlimited: no numbers, no plan label, a renewal date, no upgrade', () => {
		const usage = normalizeUsage( {
			...tieredPayload(),
			'current-tier': { value: 1 },
		} );

		expect( usage.unlimited ).toBe( true );
		expect( usage.requestsCount ).toBeNull();
		expect( usage.requestsLimit ).toBeNull();
		expect( usage.requestsAvailable ).toBeNull();
		expect( usage.planLabel ).toBeNull();
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
