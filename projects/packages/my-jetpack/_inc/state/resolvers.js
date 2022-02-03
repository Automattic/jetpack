/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { REST_API_SITE_PURCHASES_ENDPOINT, REST_API_SITE_PRODUCTS_ENDPOINT } from './constants';

const myJetpackResolvers = {
	getProduct: ( productId ) => async ( { dispatch } ) => {
		try {
			dispatch.setProduct(
				await apiFetch( {
					path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
				} )
			);
		} catch ( error ) {
			// Pick error from the response body.
			if ( error?.code && error?.message ) {
				dispatch.setRequestProductError( productId, error );
			} else {
				throw new Error( error );
			}
		}
	},

	getPurchases: () => async ( { dispatch } ) => {
		dispatch.setPurchasesIsFetching( true );

		try {
			dispatch.setPurchases( await apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ) );
			dispatch.setPurchasesIsFetching( false );
		} catch ( error ) {
			dispatch.setPurchasesIsFetching( false );
			throw error;
		}
	},
};

export default {
	...myJetpackResolvers,
};
