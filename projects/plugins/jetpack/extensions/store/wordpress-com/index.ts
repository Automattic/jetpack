/**
 * External dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
/**
 * Types & Constants
 */
type Plan = {
	product_id: number;
	product_name: string;
	product_slug: string;
};

type PlanStateProps = {
	plans: Array< Plan >;
};

const store = 'wordpress-com/plans';

const INITIAL_STATE: PlanStateProps = {
	plans: [],
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
};

const wordpressPlansStore = createReduxStore( store, {
	reducer( state = INITIAL_STATE, action ) {
		switch ( action.type ) {
			case 'SET_PLANS':
				return {
					...state,
					plans: action.plans,
				};
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
	},
} );

register( wordpressPlansStore );
