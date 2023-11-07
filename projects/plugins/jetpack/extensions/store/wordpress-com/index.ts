/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { AIFeatureProps } from '../../blocks/ai-assistant/hooks/use-ai-feature';
import { SiteAIAssistantFeatureEndpointResponseProps } from '../../types';
/**
 * Types & Constants
 */
type Plan = {
	product_id: number;
	product_name: string;
	product_slug: string;
};

type Feature = AIFeatureProps & {
	feature_slug: 'AI_ASSISTANT' | string;
};

type PlanStateProps = {
	plans: Array< Plan >;
	features: {
		aiAssistant?: Feature;
	};
};

const store = 'wordpress-com/plans';

const INITIAL_STATE: PlanStateProps = {
	plans: [],
	features: {},
};

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

	storeAiAssistantFeature( feature: Feature ) {
		return {
			type: 'STORE_AI_ASSISTANT_FEATURE',
			feature,
		};
	},
};

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
				dispatch( actions.storeAiAssistantFeature( response ) );
			},
	},
} );

register( wordpressPlansStore );
