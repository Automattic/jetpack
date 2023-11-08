/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Types
 */
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
		currentTier: {
			value: response[ 'current-tier' ]?.value || 1,
		},
	};
}

const actions = {
	setPlans( plans: Array< Plan > ) {
		return {
			type: 'SET_PLANS',
			plans,
		};
	},

	fetchFromAPI( url: string ) {
		return {
			type: 'FETCH_FROM_API',
			url,
		};
	},

	storeAiAssistantFeature( feature: AiFeatureProps ) {
		return {
			type: 'STORE_AI_ASSISTANT_FEATURE',
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
			dispatch( { type: 'REQUEST_AI_ASSISTANT_FEATURE' } );

			try {
				const response: SiteAIAssistantFeatureEndpointResponseProps = await apiFetch( {
					path: '/wpcom/v2/jetpack-ai/ai-assistant-feature',
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
};

export default actions;
