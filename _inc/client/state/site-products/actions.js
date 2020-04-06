/**
 * Internal dependencies
 */
import {
	JETPACK_SITE_PRODUCTS_FETCH,
	JETPACK_SITE_PRODUCTS_FETCH_FAIL,
	JETPACK_SITE_PRODUCTS_FETCH_RECEIVE,
} from 'state/action-types';
import restApi from 'rest-api';

export const fetchSiteProducts = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_PRODUCTS_FETCH,
		} );
		return restApi
			.fetchSiteProducts()
			.then( response => {
				dispatch( {
					type: JETPACK_SITE_PRODUCTS_FETCH_RECEIVE,
					siteProducts: response.data,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_PRODUCTS_FETCH_FAIL,
					error,
				} );
			} );
	};
};
