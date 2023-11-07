/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import actions from './actions';
/**
 * Types
 */
import type { AiFeatureProps, PlanStateProps } from './types';
import type { SiteAIAssistantFeatureEndpointResponseProps } from '../../types';

const store = 'wordpress-com/plans';

const INITIAL_STATE: PlanStateProps = {
	plans: [],
	features: {},
};

/**
 * Map the response from the `sites/$site/ai-assistant-feature`
 * endpoint to the AI Assistant feature props.
 * @param { SiteAIAssistantFeatureEndpointResponseProps } response - The response from the endpoint.
 * @returns { AiFeatureProps }                                       The AI Assistant feature props.
 */
function mapAIFeatureResponseToAiFeatureProps(
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

const wordpressPlansStore = createReduxStore( store, {
	__experimentalUseThunks: true,

	reducer( state = INITIAL_STATE, action ) {
		switch ( action.type ) {
			case 'SET_PLANS':
				return {
					...state,
					plans: action.plans,
				};

			case 'STORE_AI_ASSISTANT_FEATURE': {
				return {
					...state,
					features: {
						...state.features,
						aiAssistant: action.feature,
					},
				};
			}
		}

		return state;
	},

	actions,

	selectors: {
		/*
		 * Return the plan with the given slug.
		 *
		 * @param {Object} state    - The Plans state tree.
		 * @param {string} planSlug - The plan slug to find.
		 * @return {Object}           The plan.
		 */
		getPlan( state: PlanStateProps, planSlug: string ) {
			return state.plans.find( plan => plan.product_slug === planSlug );
		},

		/**
		 * Return the AI Assistant feature.
		 *
		 * @param {object} state - The Plans state tree.
		 * @returns {object}       The AI Assistant feature data.
		 */
		getAiAssistantFeature( state: PlanStateProps ): object {
			return state.features.aiAssistant;
		},
	},

	controls: {
		FETCH_FROM_API( { url } ) {
			// We cannot use `@wordpress/api-fetch` here since it unconditionally sends
			// the `X-WP-Nonce` header, which is disallowed by WordPress.com.
			// (To reproduce, note that you need to call `apiFetch` with `
			// `{ credentials: 'same-origin', mode: 'cors' }`, since its defaults are
			// different from `fetch`'s.)
			return fetch( url ).then( response => response.json() );
		},
	},

	resolvers: {
		*getPlan() {
			const url = 'https://public-api.wordpress.com/rest/v1.5/plans';
			const plans = yield actions.fetchFromAPI( url );
			return actions.setPlans( plans );
		},

		getAiAssistantFeature:
			() =>
			async ( { dispatch } ) => {
				const response: SiteAIAssistantFeatureEndpointResponseProps = await apiFetch( {
					path: '/wpcom/v2/jetpack-ai/ai-assistant-feature',
				} );

				// Store the feature in the store.
				dispatch(
					actions.storeAiAssistantFeature( mapAIFeatureResponseToAiFeatureProps( response ) )
				);
			},
	},
} );

register( wordpressPlansStore );
