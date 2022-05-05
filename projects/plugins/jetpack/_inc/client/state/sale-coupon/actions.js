/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import {
	JETPACK_SALE_COUPON_FETCH,
	JETPACK_SALE_COUPON_FETCH_RECEIVE,
	JETPACK_SALE_COUPON_FETCH_FAIL,
} from 'state/action-types';

export const fetchSaleCoupon = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SALE_COUPON_FETCH,
		} );
		return restApi
			.fetchSaleCoupon()
			.then( ( { data } ) => {
				dispatch( {
					type: JETPACK_SALE_COUPON_FETCH_RECEIVE,
					data,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SALE_COUPON_FETCH_FAIL,
					error,
				} );
			} );
	};
};
