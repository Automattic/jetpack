import { getErrorTypeKey, groupKey, groupRecommendationsByStatus } from './critical-css-errors';
import type { CriticalCssErrorDetails, Provider } from './stores/critical-css-state-types';

function httpError( url: string, meta: Record< string, unknown > ): CriticalCssErrorDetails {
	return { url, message: 'HTTP 403', type: 'HttpError', meta } as CriticalCssErrorDetails;
}

const loginGated = httpError( 'https://example.com/members/', { code: 403, login_required: true } );
const firewalled = httpError( 'https://example.com/internal/', { code: 403 } );

function providerWithBothGroups( dismissed: string[] = [] ): Provider {
	return {
		key: 'singular_page',
		label: 'Single page view',
		urls: [ loginGated.url, firewalled.url ],
		success_ratio: 0.5,
		status: 'error',
		errors: [ loginGated, firewalled ],
		dismissed_errors: dismissed,
	} as Provider;
}

describe( 'getErrorTypeKey', () => {
	it( 'derives the same key as grouping does', () => {
		expect( getErrorTypeKey( loginGated ) ).toBe( groupKey( loginGated ) );
		expect( getErrorTypeKey( firewalled ) ).toBe( groupKey( firewalled ) );
	} );

	it( 'separates a login-gated status from the same status without a gate', () => {
		expect( getErrorTypeKey( loginGated ) ).not.toBe( getErrorTypeKey( firewalled ) );
	} );
} );

describe( 'groupRecommendationsByStatus', () => {
	it( 'dismissing the login-gated group leaves the plain status active', () => {
		const dismissedKey = getErrorTypeKey( loginGated );

		const { activeRecommendations, dismissedRecommendations } = groupRecommendationsByStatus( [
			providerWithBothGroups( [ dismissedKey ] ),
		] );

		expect( dismissedRecommendations.map( r => r.errorType ) ).toEqual( [ dismissedKey ] );
		expect( activeRecommendations.map( r => r.errorType ) ).toEqual( [
			getErrorTypeKey( firewalled ),
		] );
	} );

	it( 'dismissing the plain status leaves the login-gated group active', () => {
		const dismissedKey = getErrorTypeKey( firewalled );

		const { activeRecommendations, dismissedRecommendations } = groupRecommendationsByStatus( [
			providerWithBothGroups( [ dismissedKey ] ),
		] );

		expect( dismissedRecommendations.map( r => r.errorType ) ).toEqual( [ dismissedKey ] );
		expect( activeRecommendations.map( r => r.errorType ) ).toEqual( [
			getErrorTypeKey( loginGated ),
		] );
	} );
} );
