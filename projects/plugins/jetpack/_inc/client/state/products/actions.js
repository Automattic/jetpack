/**
 * Internal dependencies
 */
import {
	JETPACK_PRODUCTS_FETCH,
	JETPACK_PRODUCTS_FETCH_FAIL,
	JETPACK_PRODUCTS_FETCH_RECEIVE,
} from 'state/action-types';
import restApi from '@automattic/jetpack-api';

export const fetchProducts = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_PRODUCTS_FETCH,
		} );
		return restApi
			.fetchProducts()
			.then( products => {
				dispatch( {
					type: JETPACK_PRODUCTS_FETCH_RECEIVE,
					products,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_PRODUCTS_FETCH_FAIL,
					error,
				} );
			} );
	};
};
