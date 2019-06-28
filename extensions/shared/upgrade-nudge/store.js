/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
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
			return apiFetch( { url, credentials: 'omit', mode: 'no-cors' } );
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
