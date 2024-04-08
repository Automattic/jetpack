/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Types & Constants
 */
import {
	ACTION_DECREASE_NEW_ASYNC_REQUEST_COUNTDOWN,
	ACTION_DEQUEUE_ASYNC_REQUEST,
	ACTION_ENQUEUE_ASYNC_REQUEST,
	ACTION_FETCH_FROM_API,
	ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
	ACTION_REQUEST_AI_ASSISTANT_FEATURE,
	ACTION_SET_PLANS,
	ACTION_SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE,
	ACTION_STORE_AI_ASSISTANT_FEATURE,
	ENDPOINT_AI_ASSISTANT_FEATURE,
	NEW_ASYNC_REQUEST_TIMER_INTERVAL,
	ACTION_SET_TIER_PLANS_ENABLED,
} from './constants';
import type { Plan } from './types';
import type { AiFeatureProps } from './types';
import type { SiteAIAssistantFeatureEndpointResponseProps } from '../../types';

/**
 * Map the response from the `sites/$site/ai-assistant-feature`
 * endpoint to the AI Assistant feature props.
 * @param { SiteAIAssistantFeatureEndpointResponseProps } response - The response from the endpoint.
 * @returns { AiFeatureProps }                                       The AI Assistant feature props.
 */
export function mapAiFeatureResponseToAiFeatureProps(
	response: SiteAIAssistantFeatureEndpointResponseProps
): AiFeatureProps {
	return {
		hasFeature: !! response[ 'has-feature' ],
		isOverLimit: !! response[ 'is-over-limit' ],
		requestsCount: response[ 'requests-count' ],
		requestsLimit: response[ 'requests-limit' ],
		requireUpgrade: !! response[ 'site-require-upgrade' ],
		errorMessage: response[ 'error-message' ],
		errorCode: response[ 'error-code' ],
		upgradeType: response[ 'upgrade-type' ],
		usagePeriod: {
			currentStart: response[ 'usage-period' ]?.[ 'current-start' ],
			nextStart: response[ 'usage-period' ]?.[ 'next-start' ],
			requestsCount: response[ 'usage-period' ]?.[ 'requests-count' ] || 0,
		},
		currentTier: response[ 'current-tier' ],
		nextTier: response[ 'next-tier' ],
		tierPlansEnabled: !! response[ 'tier-plans-enabled' ],
		costs: response.costs,
	};
}

const actions = {
	setPlans( plans: Array< Plan > ) {
		return {
			type: ACTION_SET_PLANS,
			plans,
		};
	},

	fetchFromAPI( url: string ) {
		return {
			type: ACTION_FETCH_FROM_API,
			url,
		};
	},

	storeAiAssistantFeature( feature: AiFeatureProps ) {
		return {
			type: ACTION_STORE_AI_ASSISTANT_FEATURE,
			feature,
		};
	},

	/**
	 * Thunk action to fetch the AI Assistant feature from the API.
	 *
	 * @returns {Function} The thunk action.
	 */
	fetchAiAssistantFeature() {
		return async ( { dispatch } ) => {
			// Dispatch isFetching action.
			dispatch( { type: ACTION_REQUEST_AI_ASSISTANT_FEATURE } );

			try {
				const response: SiteAIAssistantFeatureEndpointResponseProps = await apiFetch( {
					path: ENDPOINT_AI_ASSISTANT_FEATURE,
				} );

				// Store the feature in the store.
				dispatch(
					actions.storeAiAssistantFeature( mapAiFeatureResponseToAiFeatureProps( response ) )
				);
			} catch ( err ) {
				// @todo: Handle error.
				console.error( err ); // eslint-disable-line no-console
			}
		};
	},

	/**
	 * This thunk action is used to increase
	 * the requests count for the current usage period.
	 * @param {number} count - The number of requests to increase. Default is 1.
	 * @returns {Function}     The thunk action.
	 */
	increaseAiAssistantRequestsCount( count: number = 1 ) {
		return ( { dispatch } ) => {
			dispatch( {
				type: ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
				count,
			} );

			// Every time the requests count is increased, decrease the countdown
			dispatch( actions.decreaseAsyncRequestCountdownValue() );
		};
	},

	/**
	 * This thunk action is used to decrease
	 * the countdown value for the new async request.
	 * When the countdown reaches 0, enqueue a new async request.
	 *
	 * @returns {Function} The thunk action.
	 */
	decreaseAsyncRequestCountdownValue() {
		return async ( { dispatch, select } ) => {
			dispatch( { type: ACTION_DECREASE_NEW_ASYNC_REQUEST_COUNTDOWN } );

			const asyncCoundown = select.getAsyncRequestCountdownValue();
			if ( asyncCoundown <= 0 ) {
				dispatch( actions.enqueueAiAssistantFeatureAsyncRequest() );
			}
		};
	},

	/**
	 * This thunk action is used to enqueue a new async request.
	 * If already exist an enqueue request, clear it and enqueue a new one.
	 *
	 * @returns {Function} The thunk action.
	 */
	enqueueAiAssistantFeatureAsyncRequest() {
		return ( { dispatch } ) => {
			// Check if there is already a timer running
			dispatch.dequeueAiAssistantFeatureAsyncRequest();

			const contdownTimerId = setTimeout( () => {
				dispatch( actions.fetchAiAssistantFeature() );
			}, NEW_ASYNC_REQUEST_TIMER_INTERVAL ); // backend process requires a delay to be able to see the new value

			dispatch( { type: ACTION_ENQUEUE_ASYNC_REQUEST, timerId: contdownTimerId } );
		};
	},

	/**
	 * This thunk action is used to dequeue a new async request.
	 * It will clear the timer if there is one,
	 * canceling the enqueue async request.
	 *
	 * @returns {Function} The thunk action.
	 */
	dequeueAiAssistantFeatureAsyncRequest() {
		return ( { dispatch, select } ) => {
			dispatch( { type: ACTION_DEQUEUE_ASYNC_REQUEST, timerId: 0 } );

			const timerId = select.getAsyncRequestCountdownTimerId();
			// If there is no timer, there is nothing to clear
			if ( ! timerId ) {
				return;
			}

			window?.clearTimeout( timerId );
		};
	},

	setAiAssistantFeatureRequireUpgrade( requireUpgrade: boolean = true ) {
		return {
			type: ACTION_SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE,
			requireUpgrade,
		};
	},

	setTierPlansEnabled( tierPlansEnabled: boolean = true ) {
		return {
			type: ACTION_SET_TIER_PLANS_ENABLED,
			tierPlansEnabled,
		};
	},
};

export default actions;
