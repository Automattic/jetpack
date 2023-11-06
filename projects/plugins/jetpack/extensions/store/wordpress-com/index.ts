import { createReduxStore, register } from '@wordpress/data';

const store = 'wordpress-com/plans';

const actions = {
	setPlans( plans ) {
		return {
			type: 'SET_PLANS',
			plans,
		};
	},

	fetchFromAPI( url ) {
		return {
			type: 'FETCH_FROM_API',
			url,
		};
	},
};

const wordpressPlansStore = createReduxStore( store, {
	reducer( state = [], action ) {
		switch ( action.type ) {
			case 'SET_PLANS':
				return action.plans;
		}

		return state;
	},

	actions,

	selectors: {
		getPlan( state, planSlug: string ) {
			return state.find( plan => plan.product_slug === planSlug );
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
