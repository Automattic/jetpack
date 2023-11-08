/**
 * External dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import actions from './actions';
import reducer from './reducer';
/**
 * Types
 */
import type { PlanStateProps } from './types';

const store = 'wordpress-com/plans';

const wordpressPlansStore = createReduxStore( store, {
	__experimentalUseThunks: true,

	actions,

	reducer,

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
