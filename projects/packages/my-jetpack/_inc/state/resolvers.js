import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import {
	REST_API_SITE_PURCHASES_ENDPOINT,
	REST_API_SITE_PRODUCTS_ENDPOINT,
	PRODUCTS_THAT_NEEDS_INITIAL_FETCH,
} from './constants';

const myJetpackResolvers = {
	getProduct: {
		isFulfilled: ( state, productId ) => {
			const items = state?.products?.items || {};
			return (
				items.hasOwnProperty( productId ) &&
				! PRODUCTS_THAT_NEEDS_INITIAL_FETCH.includes( productId )
			);
		},
		fulfill: productId => async ( { dispatch } ) => {
			try {
				dispatch.setIsFetchingProduct( productId, true );
				const response = await apiFetch( {
					path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
				} );
				dispatch.setProduct( response );
				dispatch.setIsFetchingProduct( productId, false );
				return Promise.resolve();
			} catch ( error ) {
				dispatch.setIsFetchingProduct( productId, false );

				// Pick error from the response body.
				if ( error?.code && error?.message ) {
					dispatch.setRequestProductError( productId, error );
					return Promise.reject( error );
				}
				throw new Error( error );
			}
		},
	},

	getPurchases: () => async ( { dispatch } ) => {
		dispatch.setPurchasesIsFetching( true );

		try {
			dispatch.setPurchases( await apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ) );
			dispatch.setPurchasesIsFetching( false );
		} catch ( error ) {
			dispatch.setPurchasesIsFetching( false );
			dispatch.setGlobalNotice(
				__(
					'There was an error fetching your purchases information. Check your site connectivity and try again.',
					'jetpack-my-jetpack'
				),
				{
					status: 'error',
				}
			);
		}
	},
};

export default {
	...myJetpackResolvers,
};
