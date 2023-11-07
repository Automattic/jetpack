/**
 * External dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import actions from './actions';
/**
 * Types
 */
import type { PlanStateProps } from './types';

const store = 'wordpress-com/plans';

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
		},
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

			case 'REQUEST_AI_ASSISTANT_FEATURE':
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

			case 'STORE_AI_ASSISTANT_FEATURE': {
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

		getAiAssistantFeature: ( state: PlanStateProps ) => {
			if ( state?.features?.aiAssistant ) {
				return;
			}

			return actions.fetchAiAssistantFeature();
		},
	},
} );

register( wordpressPlansStore );
