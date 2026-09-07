/**
 * Internal dependencies
 */
import actions from '../actions.ts';
import {
	ACTION_REQUEST_AI_ASSISTANT_FEATURE,
	ACTION_SET_AI_ASSISTANT_FEATURE_ERROR,
	FREE_PLAN_REQUESTS_LIMIT,
} from '../constants.ts';
import reducer from '../reducer.ts';
import type { PlanStateProps } from '../types.ts';

/**
 * State for a site that holds a paid tier and has a request in flight.
 *
 * @return {PlanStateProps} The state.
 */
function paidPlanState(): PlanStateProps {
	return {
		plans: [],
		features: {
			aiAssistant: {
				hasFeature: true,
				isOverLimit: false,
				requestsCount: 4,
				requestsLimit: FREE_PLAN_REQUESTS_LIMIT,
				requireUpgrade: false,
				errorCode: '',
				errorMessage: '',
				upgradeType: 'default',
				currentTier: { slug: 'ai-assistant-tier-100', value: 100, limit: 100 },
				nextTier: null,
				_meta: {
					isRequesting: true,
					asyncRequestCountdown: 3,
					asyncRequestTimerId: 0,
				},
			},
		},
	};
}

describe( 'setAiAssistantFeatureError', () => {
	it( 'should create an action carrying the code, message and status', () => {
		expect(
			actions.setAiAssistantFeatureError( {
				code: 'failed_to_fetch_data',
				message: 'Unable to fetch the requested data.',
				status: 403,
			} )
		).toEqual( {
			type: ACTION_SET_AI_ASSISTANT_FEATURE_ERROR,
			code: 'failed_to_fetch_data',
			message: 'Unable to fetch the requested data.',
			status: 403,
		} );
	} );
} );

describe( 'AI Assistant feature error state', () => {
	it( 'should record the error code, message and status', () => {
		const state = reducer(
			paidPlanState(),
			actions.setAiAssistantFeatureError( {
				code: 'failed_to_fetch_data',
				message: 'Unable to fetch the requested data.',
				status: 403,
			} )
		);

		expect( state.features.aiAssistant.errorCode ).toBe( 'failed_to_fetch_data' );
		expect( state.features.aiAssistant.errorMessage ).toBe( 'Unable to fetch the requested data.' );
		expect( state.features.aiAssistant.errorStatus ).toBe( 403 );
	} );

	// The editor's usage panel reveals its upgrade button once loading clears, so a
	// refused user must not be moved out of the loading state.
	it( 'should leave the in-flight flag alone', () => {
		const state = reducer(
			paidPlanState(),
			actions.setAiAssistantFeatureError( { code: 'x', message: 'y', status: 500 } )
		);

		expect( state.features.aiAssistant._meta.isRequesting ).toBe( true );
	} );

	it( 'should clear a previous error when a new request starts', () => {
		const errored = reducer(
			paidPlanState(),
			actions.setAiAssistantFeatureError( { code: 'x', message: 'y', status: 403 } )
		);

		const state = reducer( errored, { type: ACTION_REQUEST_AI_ASSISTANT_FEATURE } );

		expect( state.features.aiAssistant.errorCode ).toBe( '' );
		expect( state.features.aiAssistant.errorStatus ).toBeUndefined();
	} );

	it( 'should leave the entitlement fields untouched', () => {
		const state = reducer(
			paidPlanState(),
			actions.setAiAssistantFeatureError( { code: 'x', message: 'y', status: 403 } )
		);

		expect( state.features.aiAssistant.hasFeature ).toBe( true );
		expect( state.features.aiAssistant.requireUpgrade ).toBe( false );
		expect( state.features.aiAssistant.currentTier ).toEqual( {
			slug: 'ai-assistant-tier-100',
			value: 100,
			limit: 100,
		} );
	} );

	it( 'should clear a previous error once the feature loads', () => {
		const errored = reducer(
			paidPlanState(),
			actions.setAiAssistantFeatureError( { code: 'x', message: 'y', status: 403 } )
		);

		const state = reducer(
			errored,
			actions.storeAiAssistantFeature( {
				hasFeature: true,
				isOverLimit: false,
				requestsCount: 5,
				requestsLimit: FREE_PLAN_REQUESTS_LIMIT,
				requireUpgrade: false,
				upgradeType: 'default',
				currentTier: null,
				nextTier: null,
			} )
		);

		expect( state.features.aiAssistant.errorCode ).toBeFalsy();
		expect( state.features.aiAssistant.errorMessage ).toBeFalsy();
		expect( state.features.aiAssistant.errorStatus ).toBeUndefined();
	} );
} );
