/**
 * External dependencies
 */
import { registerStore } from '@wordpress/data';

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

registerStore( 'wordpress-com/plans', {
	reducer( state = {}, action ) {
		switch ( action.type ) {
			case 'SET_PLANS':
				return action.plans;
		}

		return state;
	},

	actions,

	selectors: {
		getPlan( state ) {
			return state; // TODO: Find and return plan by planSlug
		},
	},

	controls: {
		FETCH_FROM_API( { url } ) {
			// We cannot use `@wordpress/api-fetch` here since it unconditionally sends
			// the `X-WP-Nonce` header, which is disallowed by WordPress.com
			return fetch( url, { credentials: 'same-origin', mode: 'cors' } ).then( response =>
				response.json()
			);
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
