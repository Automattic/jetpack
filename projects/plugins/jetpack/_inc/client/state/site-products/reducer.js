import { combineReducers } from 'redux';
import {
	JETPACK_SITE_PRODUCTS_FETCH,
	JETPACK_SITE_PRODUCTS_FETCH_FAIL,
	JETPACK_SITE_PRODUCTS_FETCH_RECEIVE,
} from 'state/action-types';

export const items = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SITE_PRODUCTS_FETCH_RECEIVE:
			return action.siteProducts;
		default:
			return state;
	}
};

export const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SITE_PRODUCTS_FETCH:
			return { ...state, isFetching: true };
		case JETPACK_SITE_PRODUCTS_FETCH_RECEIVE:
		case JETPACK_SITE_PRODUCTS_FETCH_FAIL:
			return { ...state, isFetching: false };
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	items,
	requests,
} );

/**
 * Returns true if currently requesting site products. Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether site products are being requested
 */
export function isFetchingSiteProducts( state ) {
	return !! state.jetpack.siteProducts.requests.isFetching;
}

/**
 * Returns WP.com site products that are relevant to Jetpack.
 * @param  {Object}  state Global state tree
 * @return {Object}  Site products
 */
export function getSiteProducts( state ) {
	return state.jetpack.siteProducts.items;
}
