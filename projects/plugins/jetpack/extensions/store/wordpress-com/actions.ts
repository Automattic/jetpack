/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Types & Constants
 */
import {
	ACTION_FETCH_FROM_API,
	ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
	ACTION_REQUEST_AI_ASSISTANT_FEATURE,
	ACTION_SET_PLANS,
	ACTION_STORE_AI_ASSISTANT_FEATURE,
	ENDPOINT_AI_ASSISTANT_FEATURE,
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
export function mapAIFeatureResponseToAiFeatureProps(
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
					actions.storeAiAssistantFeature( mapAIFeatureResponseToAiFeatureProps( response ) )
				);
			} catch ( err ) {
				// @todo: Handle error.
				console.error( err ); // eslint-disable-line no-console
			}
		};
	},

	increaseAiAssistantRequestsCount( count = 1 ) {
		return {
			type: ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
			count,
		};
	},
};

export default actions;
