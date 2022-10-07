import {
	PLAN_JETPACK_ANTI_SPAM,
	PLAN_JETPACK_COMPLETE,
	PLAN_JETPACK_SECURITY_DAILY,
} from '../../../lib/plans/constants';
import {
	ONBOARDING_JETPACK_ANTI_SPAM,
	ONBOARDING_JETPACK_COMPLETE,
	ONBOARDING_JETPACK_SECURITY,
} from '../../../recommendations/constants';
import { getOnboardingNameByProductSlug } from '../onboarding-utils';
import {
	getInitialStep,
	getInitialStepForOnboarding,
	getOnboardingData,
	isOnboardingEligibleToShowInSummary,
} from '../reducer';

const defaultOnboardingData = { active: null, viewed: [], hasStarted: false };
const mockEligiblePurchase = product_slug => ( {
	product_slug,
	active: '1',
	subscribed_date: new Date( 2022, 9, 1 ), // 2022-10-01
} );

const mockNonEligiblePurchase = product_slug => ( {
	product_slug,
	active: null,
	subscribed_date: new Date( 2022, 5, 1 ), // 2022-6-01
} );

const getMockedState = ( {
	fetchingInProgress = false,
	onboarding = defaultOnboardingData,
	sitePurchases = [],
	initialStep = undefined,
	viewedRecommendations = [],
} ) => ( {
	jetpack: {
		initialState: {
			recommendationsStep: initialStep,
		},
		siteData: {
			requests: {
				isFetchingSiteData: fetchingInProgress,
				isFetchingSiteFeatures: fetchingInProgress,
				isFetchingSitePlans: fetchingInProgress,
				isFetchingSitePurchases: fetchingInProgress,
			},
			data: {
				sitePurchases,
			},
		},
		recommendations: {
			requests: {
				isRecommendationsDataLoaded: ! fetchingInProgress,
			},
			data: {
				onboardingActive: onboarding.active,
				onboardingViewed: onboarding.viewed,
				onboardingHasStarted: onboarding.hasStarted,
				viewedRecommendations,
			},
		},
	},
} );

describe( 'Recommendations reducer', () => {
	describe( 'getOnboardingData()', () => {
		it( 'Returns null when fetching is in progress', () => {
			const mockedState = getMockedState( { fetchingInProgress: true } );

			expect( getOnboardingData( mockedState ) ).toBeNull();
		} );

		it( 'Returns current state if onboarding is active', () => {
			const mockedOnboardingData = {
				...defaultOnboardingData,
				active: ONBOARDING_JETPACK_ANTI_SPAM,
			};
			const mockedState = getMockedState( {
				onboarding: mockedOnboardingData,
			} );

			const result = getOnboardingData( mockedState );
			expect( result ).toMatchObject( mockedOnboardingData );
		} );

		it( 'Sets onboarding as active if one is eligible', () => {
			const mockedPurchases = [ mockEligiblePurchase( PLAN_JETPACK_ANTI_SPAM ) ];
			const mockedState = getMockedState( {
				sitePurchases: mockedPurchases,
			} );

			const result = getOnboardingData( mockedState );
			expect( result ).toMatchObject( {
				active: getOnboardingNameByProductSlug( PLAN_JETPACK_ANTI_SPAM ),
				viewed: [ getOnboardingNameByProductSlug( PLAN_JETPACK_ANTI_SPAM ) ],
				hasStarted: false,
			} );
		} );

		it( 'Returns current state if no onboarding is eligible to activate', () => {
			const mockedOnboardingData = defaultOnboardingData;
			const mockedPurchases = [ mockNonEligiblePurchase( PLAN_JETPACK_ANTI_SPAM ) ];
			const mockedState = getMockedState( {
				onboarding: mockedOnboardingData,
				sitePurchases: mockedPurchases,
			} );

			const result = getOnboardingData( mockedState );
			expect( result ).toMatchObject( mockedOnboardingData );
		} );

		it( 'Does not activate onboarding if it was already viewed', () => {
			const mockedOnboardingData = {
				...defaultOnboardingData,
				viewed: [ ONBOARDING_JETPACK_ANTI_SPAM ],
			};
			const mockedPurchases = [ mockEligiblePurchase( PLAN_JETPACK_ANTI_SPAM ) ];
			const mockedState = getMockedState( {
				onboarding: mockedOnboardingData,
				sitePurchases: mockedPurchases,
			} );

			const result = getOnboardingData( mockedState );
			expect( result.active ).toBeNull();
		} );

		it( 'Does not return onboarding as viewed when purchase is not eligible anymore', () => {
			const mockedOnboardingData = {
				...defaultOnboardingData,
				viewed: [ ONBOARDING_JETPACK_ANTI_SPAM ],
			};
			const mockedPurchases = [ mockNonEligiblePurchase( PLAN_JETPACK_ANTI_SPAM ) ];
			const mockedState = getMockedState( {
				onboarding: mockedOnboardingData,
				sitePurchases: mockedPurchases,
			} );

			const result = getOnboardingData( mockedState );
			expect( result.viewed ).toHaveLength( 0 );
		} );
	} );
	describe( 'isOnboardingEligibleToShowInSummary()', () => {
		it( 'Returns true if onboarding was viewed', () => {
			const mockedState = getMockedState( {
				onboarding: {
					...defaultOnboardingData,
					viewed: [ ONBOARDING_JETPACK_ANTI_SPAM ],
				},
				sitePurchases: [ mockEligiblePurchase( PLAN_JETPACK_ANTI_SPAM ) ],
			} );

			const result = isOnboardingEligibleToShowInSummary(
				mockedState,
				ONBOARDING_JETPACK_ANTI_SPAM
			);

			expect( result ).toBe( true );
		} );

		it( 'Returns false if onboarding was not viewed', () => {
			const mockedState = getMockedState( {} );

			const result = isOnboardingEligibleToShowInSummary(
				mockedState,
				ONBOARDING_JETPACK_ANTI_SPAM
			);

			expect( result ).toBe( false );
		} );

		it( 'Returns false when Complete onboarding is viewed (for VideoPress, Search, Security)', () => {
			const mockedState = getMockedState( {
				onboarding: {
					...defaultOnboardingData,
					viewed: [ ONBOARDING_JETPACK_COMPLETE, ONBOARDING_JETPACK_SECURITY ],
				},
				sitePurchases: [
					mockEligiblePurchase( PLAN_JETPACK_COMPLETE, PLAN_JETPACK_SECURITY_DAILY ),
				],
			} );

			const result = isOnboardingEligibleToShowInSummary(
				mockedState,
				ONBOARDING_JETPACK_SECURITY
			);

			expect( result ).toBe( false );
		} );

		it( 'Returns false when Complete or Security onboarding is viewed (for Backup, Anti-Spam, Scan)', () => {
			const mockedState = getMockedState( {
				onboarding: {
					...defaultOnboardingData,
					viewed: [ ONBOARDING_JETPACK_SECURITY ],
				},
				sitePurchases: [
					mockEligiblePurchase( PLAN_JETPACK_SECURITY_DAILY, PLAN_JETPACK_ANTI_SPAM ),
				],
			} );

			const result = isOnboardingEligibleToShowInSummary(
				mockedState,
				ONBOARDING_JETPACK_ANTI_SPAM
			);

			expect( result ).toBe( false );
		} );
	} );

	describe( 'getInitialStep()', () => {
		it( 'Redirects to site-type question when not viewed and in summary', () => {
			const mockedState = getMockedState( {
				initialStep: 'summary',
			} );

			const result = getInitialStep( mockedState );

			expect( result ).toBe( 'site-type-question' );
		} );

		it( 'Returns initialStep when site-type question was viewed and onboarding finished', () => {
			const mockedState = getMockedState( {
				initialStep: 'foobar',
				viewedRecommendations: [ 'foobar' ],
			} );

			const result = getInitialStep( mockedState );

			expect( result ).toBe( 'foobar' );
		} );

		it( 'Returns first step for onboarding when active but not started', () => {
			const mockedState = getMockedState( {
				initialStep: 'foobar',
				onboarding: {
					...defaultOnboardingData,
					active: ONBOARDING_JETPACK_ANTI_SPAM,
				},
				viewedRecommendations: [ 'foobar' ],
			} );

			const result = getInitialStep( mockedState );
			expect( result ).toBe( getInitialStepForOnboarding( ONBOARDING_JETPACK_ANTI_SPAM ) );
		} );

		it( 'Returns initialStep when onboarding has started', () => {
			const mockedState = getMockedState( {
				initialStep: 'foobar',
				onboarding: {
					...defaultOnboardingData,
					active: ONBOARDING_JETPACK_ANTI_SPAM,
					hasStarted: true,
				},
				viewedRecommendations: [ 'foobar' ],
			} );

			const result = getInitialStep( mockedState );

			expect( result ).toBe( 'foobar' );
		} );
	} );
} );
