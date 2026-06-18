/**
 * Internal dependencies
 */
import { selectors } from '../index.ts';
import type { PlanStateProps } from '../types.ts';

jest.mock( '@wordpress/data', () => ( {
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

const buildState = (): PlanStateProps => ( {
	plans: [
		{ product_id: 1, product_name: 'Free', product_slug: 'free_plan' },
		{ product_id: 2, product_name: 'Pro', product_slug: 'pro_plan' },
	],
	features: {
		aiAssistant: {
			hasFeature: true,
			isOverLimit: false,
			requestsCount: 5,
			requestsLimit: 20,
			requireUpgrade: false,
			upgradeType: 'default',
			_meta: {
				isRequesting: true,
				asyncRequestCountdown: 3,
				asyncRequestTimerId: 42,
			},
		},
	},
} );

describe( 'wordpress-com/plans selectors', () => {
	test( 'getPlan returns the plan matching the slug', () => {
		const state = buildState();
		expect( selectors.getPlan( state, 'pro_plan' ) ).toEqual( state.plans[ 1 ] );
	} );

	test( 'getPlan returns undefined for an unknown slug', () => {
		expect( selectors.getPlan( buildState(), 'does-not-exist' ) ).toBeUndefined();
	} );

	test( 'getAiAssistantFeature returns the feature without its _meta', () => {
		const result = selectors.getAiAssistantFeature( buildState() );
		expect( result ).not.toHaveProperty( '_meta' );
		expect( result.hasFeature ).toBe( true );
		expect( result.requestsCount ).toBe( 5 );
	} );

	test( 'getIsRequestingAiAssistantFeature reflects the _meta flag', () => {
		expect( selectors.getIsRequestingAiAssistantFeature( buildState() ) ).toBe( true );
	} );

	test( 'countdown selectors read from _meta', () => {
		const state = buildState();
		expect( selectors.getAsyncRequestCountdownValue( state ) ).toBe( 3 );
		expect( selectors.getAsyncRequestCountdownTimerId( state ) ).toBe( 42 );
	} );

	test( 'meta selectors are undefined-safe when aiAssistant is absent', () => {
		const empty: PlanStateProps = { plans: [], features: {} };
		expect( selectors.getIsRequestingAiAssistantFeature( empty ) ).toBeUndefined();
		expect( selectors.getAsyncRequestCountdownValue( empty ) ).toBeUndefined();
		expect( selectors.getAsyncRequestCountdownTimerId( empty ) ).toBeUndefined();
	} );
} );
