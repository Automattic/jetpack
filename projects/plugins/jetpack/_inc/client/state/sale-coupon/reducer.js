/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_SALE_COUPON_FETCH,
	JETPACK_SALE_COUPON_FETCH_RECEIVE,
	JETPACK_SALE_COUPON_FETCH_FAIL,
} from 'state/action-types';

export const data = ( state = [], action ) => {
	switch ( action.type ) {
		case JETPACK_SALE_COUPON_FETCH_RECEIVE:
			return action.data.coupon;
		default:
			return state;
	}
};

export const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SALE_COUPON_FETCH:
			return { ...state, isFetching: true };
		case JETPACK_SALE_COUPON_FETCH_RECEIVE:
		case JETPACK_SALE_COUPON_FETCH_FAIL:
			return { ...state, isFetching: false };
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests,
} );

/**
 * Returns true if currently requesting site sale coupon. Otherwise false.
 *
 * @param  {object} state - Global state tree
 * @returns {boolean} Whether sale coupon are being requested
 */
export function isFetchingSaleCoupon( state ) {
	return !! state.jetpack.saleCoupon.requests.isFetching;
}

/**
 * Returns sale coupon.
 *
 * @param  {object} state - Global state tree
 * @returns {object} Intro offers
 */
export function getSaleCoupon( state ) {
	return state.jetpack.saleCoupon.data;
}
