/**
 * Internal dependencies
 */
import actions from '../actions';
import {
	ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
	FREE_PLAN_REQUESTS_LIMIT,
} from '../constants';
import reducer from '../reducer';
import { AiFeatureProps, PlanStateProps } from '../types';

describe( 'actions', () => {
	it( 'should create an action to store the AI Assistant feature', () => {
		const feature_in_free_plan: AiFeatureProps = {
			hasFeature: false,
			isOverLimit: false,
			requestsCount: 10,
			requestsLimit: FREE_PLAN_REQUESTS_LIMIT,
			requireUpgrade: false,
			upgradeType: 'default',
			currentTier: null,
			nextTier: null,
		};

		const expectedAction = {
			type: 'STORE_AI_ASSISTANT_FEATURE',
			feature: feature_in_free_plan,
		};
		expect( actions.storeAiAssistantFeature( feature_in_free_plan ) ).toEqual( expectedAction );
	} );
} );

describe( 'reducer', () => {
	it( 'should set the feature unavalaible for a Free plan when the site achieves the limit', () => {
		const initialState: PlanStateProps = {
			plans: [],
			features: {
				aiAssistant: {
					hasFeature: false,
					isOverLimit: false,
					requestsCount: 19, // 1 request left :screams:
					requestsLimit: FREE_PLAN_REQUESTS_LIMIT,
					requireUpgrade: false,
					upgradeType: 'default',
					currentTier: null,
					nextTier: null,
					usagePeriod: {
						currentStart: 'ai-assistant-tier-free',
						nextStart: '',
						requestsCount: 4,
					},
				},
			},
		};

		const action = { type: ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT, count: 1 };

		const expectedState = {
			...initialState,
			features: {
				aiAssistant: {
					...initialState.features.aiAssistant,
					hasFeature: false,
					isOverLimit: true,
					requestsCount: 20,
					requireUpgrade: true,
					usagePeriod: {
						...initialState.features.aiAssistant.usagePeriod,
						requestsCount: 5,
					},
				},
			},
		};

		expect( reducer( initialState, action ) ).toEqual( expectedState );
	} );

	// Pruebas adicionales para otras acciones aquí...
} );
