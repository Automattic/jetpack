import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { accessOptions } from '../constants';
import { getPaidAccessState, getPaidPlanLink, getShowMisconfigurationWarning } from '../utils';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	isWpcomPlatformSite: jest.fn(),
} ) );

describe( 'getPaidPlanLink', () => {
	describe( 'on WordPress.com and Atomic sites', () => {
		beforeEach( () => jest.mocked( isWpcomPlatformSite ).mockReturnValue( true ) );

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
		beforeEach( () => jest.mocked( isWpcomPlatformSite ).mockReturnValue( false ) );

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
		jest.mocked( isWpcomPlatformSite ).mockReturnValue( true );
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

	test( 'stays quiet for a password-protected post', () => {
		expect( getShowMisconfigurationWarning( 'password', 'subscribers' ) ).toBe( false );
	} );

	test( 'stays quiet when the post is open to everybody', () => {
		expect( getShowMisconfigurationWarning( 'private', 'everybody' ) ).toBe( false );
	} );
} );

describe( 'getPaidAccessState', () => {
	const connected = { stripeConnectUrl: null, hasTierPlans: true };

	test( 'offers paid access once Stripe is connected and a tier exists', () => {
		expect(
			getPaidAccessState( { ...connected, accessLevel: accessOptions.subscribers.key } )
		).toEqual( { isPaidAvailable: true, showPaidAsDisabled: false, showSetupPrompt: false } );
	} );

	test( 'disables paid access without Stripe', () => {
		expect(
			getPaidAccessState( {
				stripeConnectUrl: 'https://example.com/connect',
				hasTierPlans: true,
				accessLevel: accessOptions.subscribers.key,
			} )
		).toEqual( { isPaidAvailable: false, showPaidAsDisabled: true, showSetupPrompt: true } );
	} );

	test( 'disables paid access without a tier', () => {
		expect(
			getPaidAccessState( {
				stripeConnectUrl: null,
				hasTierPlans: false,
				accessLevel: accessOptions.everybody.key,
			} )
		).toEqual( { isPaidAvailable: false, showPaidAsDisabled: true, showSetupPrompt: true } );
	} );

	test( 'keeps paid disabled but holds the setup prompt while the status is loading', () => {
		expect(
			getPaidAccessState( {
				stripeConnectUrl: null,
				hasTierPlans: false,
				accessLevel: accessOptions.subscribers.key,
				isLoading: true,
			} )
		).toEqual( { isPaidAvailable: false, showPaidAsDisabled: true, showSetupPrompt: false } );
	} );

	test( 'keeps paid selectable on a post already set to paid after Stripe disconnects', () => {
		expect(
			getPaidAccessState( {
				stripeConnectUrl: 'https://example.com/connect',
				hasTierPlans: true,
				accessLevel: accessOptions.paid_subscribers.key,
			} )
		).toEqual( { isPaidAvailable: false, showPaidAsDisabled: false, showSetupPrompt: false } );
	} );
} );
