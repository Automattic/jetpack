/**
 * Types & Constants
 */
import { __ } from '@wordpress/i18n';
import {
	ACTION_DECREASE_NEW_ASYNC_REQUEST_COUNTDOWN,
	ACTION_ENQUEUE_ASYNC_REQUEST,
	ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
	ACTION_REQUEST_AI_ASSISTANT_FEATURE,
	ACTION_SET_PLANS,
	ACTION_SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE,
	ACTION_STORE_AI_ASSISTANT_FEATURE,
	ASYNC_REQUEST_COUNTDOWN_INIT_VALUE,
} from './constants';
import type { PlanStateProps } from './types';

const INITIAL_STATE: PlanStateProps = {
	plans: [],
	features: {
		aiAssistant: {
			hasFeature: false,
			isOverLimit: false,
			requestsCount: 0,
			requestsLimit: 1000,
			requireUpgrade: false,
			errorMessage: '',
			errorCode: '',
			upgradeType: 'default',
			currentTier: {
				slug: 'ai-assistant-tier-free',
				value: 0,
				limit: 20,
			},
			usagePeriod: {
				currentStart: '',
				nextStart: '',
				requestsCount: 0,
			},
			nextTier: {
				slug: 'ai-assistant-tier-unlimited',
				value: 1,
				limit: 922337203685477600,
				readableLimit: __( 'Unlimited', 'jetpack' ),
			},
			_meta: {
				isRequesting: false,
				asyncRequestCountdown: ASYNC_REQUEST_COUNTDOWN_INIT_VALUE,
				asyncRequestTimerId: 0,
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
							asyncRequestCountdown: ASYNC_REQUEST_COUNTDOWN_INIT_VALUE, // restore the countdown
							asyncRequestTimerId: 0, // reset the timer id
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
			// Increase request count;
			const requestsCount = state.features.aiAssistant.requestsCount + action.count;

			/**
			 * Compute the AI Assistant Feature data optimistically,
			 * based on the Jetpack_AI_Helper::get_ai_assistance_feature() helper.
			 *
			 * @see _inc/lib/class-jetpack-ai-helper.php
			 */
			const isOverLimit = requestsCount >= state.features.aiAssistant.requestsLimit;
			const requireUpgrade = isOverLimit && ! state.features.aiAssistant.hasFeature;

			return {
				...state,
				features: {
					...state.features,
					aiAssistant: {
						...state.features.aiAssistant,
						isOverLimit,
						requestsCount,
						requireUpgrade,
					},
				},
			};
		}

		case ACTION_DECREASE_NEW_ASYNC_REQUEST_COUNTDOWN: {
			return {
				...state,
				features: {
					...state.features,
					aiAssistant: {
						...state.features.aiAssistant,
						_meta: {
							...state.features.aiAssistant._meta,
							asyncRequestCountdown: state.features.aiAssistant._meta.asyncRequestCountdown - 1,
						},
					},
				},
			};
		}

		case ACTION_ENQUEUE_ASYNC_REQUEST: {
			return {
				...state,
				features: {
					...state.features,
					aiAssistant: {
						...state.features.aiAssistant,
						_meta: {
							...state.features.aiAssistant._meta,
							asyncRequestTimerId: action.timerId,
						},
					},
				},
			};
		}

		case ACTION_SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE: {
			return {
				...state,
				features: {
					...state.features,
					aiAssistant: {
						...state.features.aiAssistant,
						requireUpgrade: action.requireUpgrade,
						hasFeature: ! action.requireUpgrade, // If we require an upgrade, we don't have the feature.
						isOverLimit: true, // If we require an upgrade, we are over the limit.
					},
				},
			};
		}
	}

	return state;
}
