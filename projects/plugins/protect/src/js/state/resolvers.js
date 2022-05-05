/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import actions from './actions';

const resolvers = {
	getSecurityBundle: {
		isFulfilled: state => {
			return Object.keys( state?.securityBundle ).length > 0;
		},

		fulfill: () => async ( { dispatch } ) => {
			const response = await apiFetch( {
				path: '/my-jetpack/v1/site/products/security',
				method: 'GET',
			} );

			dispatch( actions.setSecurityBundle( response ) );
		},
	},
};

export default resolvers;
