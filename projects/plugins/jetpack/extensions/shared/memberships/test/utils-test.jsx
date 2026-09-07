import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { getPaidPlanLink, getShowMisconfigurationWarning } from '../utils';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	isWpcomPlatformSite: jest.fn(),
} ) );

describe( 'getPaidPlanLink', () => {
	describe( 'on WordPress.com and Atomic sites', () => {
		beforeEach( () => isWpcomPlatformSite.mockReturnValue( true ) );

		test( 'points at the site-scoped earn screen', () => {
			expect( getPaidPlanLink( true ) ).toBe(
				`https://wordpress.com/earn/payments/${ window.location.hostname }`
			);
		} );

		test( 'jumps straight to tier creation when no tier exists yet', () => {
			expect( getPaidPlanLink( false ) ).toBe(
				`https://wordpress.com/earn/payments/${ window.location.hostname }#add-tier-plan`
			);
		} );
	} );

	// Self-hosted Jetpack sites manage payments in Jetpack Cloud, which serves these
	// screens under /monetize rather than /earn.
	describe( 'on self-hosted Jetpack sites', () => {
		beforeEach( () => isWpcomPlatformSite.mockReturnValue( false ) );

		test( 'points at Jetpack Cloud rather than WordPress.com', () => {
			expect( getPaidPlanLink( true ) ).toBe(
				`https://cloud.jetpack.com/monetize/payments/${ window.location.hostname }`
			);
		} );

		test( 'jumps straight to tier creation when no tier exists yet', () => {
			expect( getPaidPlanLink( false ) ).toBe(
				`https://cloud.jetpack.com/monetize/payments/${ window.location.hostname }#add-tier-plan`
			);
		} );
	} );

	test( 'always scopes the link to the current site', () => {
		isWpcomPlatformSite.mockReturnValue( true );
		expect( getPaidPlanLink( true ) ).toContain( window.location.hostname );
	} );
} );

describe( 'getShowMisconfigurationWarning', () => {
	test( 'warns when a restricted post is not publicly visible', () => {
		expect( getShowMisconfigurationWarning( 'private', 'subscribers' ) ).toBe( true );
	} );

	test( 'stays quiet for a public post', () => {
		expect( getShowMisconfigurationWarning( 'public', 'subscribers' ) ).toBe( false );
	} );

	test( 'stays quiet when the post is open to everybody', () => {
		expect( getShowMisconfigurationWarning( 'private', 'everybody' ) ).toBe( false );
	} );
} );
