/**
 * Types & Constants
 */
import {
	ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
	ACTION_REQUEST_AI_ASSISTANT_FEATURE,
	ACTION_SET_PLANS,
	ACTION_STORE_AI_ASSISTANT_FEATURE,
} from './constants';
import type { PlanStateProps } from './types';

const INITIAL_STATE: PlanStateProps = {
	plans: [],
	features: {
		aiAssistant: {
			hasFeature: false,
			isOverLimit: false,
			requestsCount: 0,
			requestsLimit: 0,
			requireUpgrade: false,
			errorMessage: '',
			errorCode: '',
			upgradeType: 'default',
			currentTier: {
				value: 1,
			},
			usagePeriod: {
				currentStart: '',
				nextStart: '',
				requestsCount: 0,
			},
			_meta: {
				isRequesting: false,
			},
			nextTier: {
				slug: 'ai-assistant-tier-unlimited',
				value: 1,
			},
		},
	},
};

export default function reducer( state = INITIAL_STATE, action ) {
	switch ( action.type ) {
		case ACTION_SET_PLANS:
			return {
				...state,
				plans: action.plans,
			};

		case ACTION_REQUEST_AI_ASSISTANT_FEATURE:
			return {
				...state,
				features: {
					...state.features,
					aiAssistant: {
						...state.features.aiAssistant,
						_meta: {
							...state.features.aiAssistant._meta,
							isRequesting: true,
						},
					},
				},
			};

		case ACTION_STORE_AI_ASSISTANT_FEATURE: {
			return {
				...state,
				features: {
					...state.features,
					aiAssistant: {
						...action.feature,
						_meta: {
							...state.features.aiAssistant._meta,
							isRequesting: false,
						},
					},
				},
			};
		}

		case ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT: {
			return {
				...state,
				features: {
					...state.features,
					aiAssistant: {
						...state.features.aiAssistant,
						requestsCount: state.features.aiAssistant.requestsCount + action.count,
					},
				},
			};
		}
	}

	return state;
}
