import restApi from '@automattic/jetpack-api';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import {
	REST_API_SITE_PURCHASES_ENDPOINT,
	REST_API_SITE_PRODUCTS_ENDPOINT,
	PRODUCTS_THAT_NEEDS_INITIAL_FETCH,
} from './constants';
import resolveProductStatsRequest from './stats-resolvers';

const myJetpackResolvers = {
	getProduct: {
		isFulfilled: ( state, productId ) => {
			const items = state?.products?.items || {};
			return (
				items.hasOwnProperty( productId ) &&
				! PRODUCTS_THAT_NEEDS_INITIAL_FETCH.includes( productId )
			);
		},
		fulfill:
			productId =>
			async ( { dispatch } ) => {
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

	getPurchases:
		() =>
		async ( { dispatch } ) => {
			dispatch.setPurchasesIsFetching( true );

			try {
				dispatch.setPurchases( await apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ) );
				dispatch.setPurchasesIsFetching( false );
			} catch ( error ) {
				dispatch.setPurchasesIsFetching( false );
				error.code !== 'not_connected' &&
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

	getAvailableLicenses:
		() =>
		async ( { dispatch } ) => {
			dispatch.setAvailableLicensesIsFetching( true );

			try {
				const { apiRoot, apiNonce } = window?.myJetpackRest || {};
				restApi.setApiRoot( apiRoot );
				restApi.setApiNonce( apiNonce );
				const result = await restApi.getUserLicenses();

				if ( result && result.items ) {
					dispatch.setAvailableLicenses(
						result.items.filter( ( { attached_at } ) => attached_at === null )
					);
				} else {
					dispatch.setAvailableLicenses( [] );
				}
			} catch ( error ) {
				dispatch.setAvailableLicenses( [] );
			} finally {
				dispatch.setAvailableLicensesIsFetching( false );
			}
		},
};

const getProductStats = {
	isFulfilled: ( state, productId ) => {
		return state.stats?.items?.hasOwnProperty( productId ) || false;
	},
	fulfill:
		productId =>
		async ( { dispatch } ) => {
			try {
				dispatch.setIsFetchingProductStats( productId, true );

				/**
				 * Delegate the resolution to a product-specific resolver.
				 */
				const response = await resolveProductStatsRequest( productId );

				dispatch.setProductStats( productId, response );
				dispatch.setIsFetchingProductStats( productId, false );

				return Promise.resolve();
			} catch ( error ) {
				dispatch.setIsFetchingProductStats( productId, false );

				// Pick error from the response body.
				if ( error?.code && error?.message ) {
					return Promise.reject( error );
				}
				throw new Error( error );
			}
		},
};

export default {
	...myJetpackResolvers,
	getProductStats,
};
