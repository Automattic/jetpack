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
 * @param   {object} state - Global state tree
 * @returns {boolean}        Whether site products are being requested
 */
export function isFetchingSiteProducts( state ) {
	return !! state.jetpack.siteProducts.requests.isFetching;
}

/**
 * Returns WP.com site products that are relevant to Jetpack.
 *
 * @param   {object} state -  Global state tree
 * @returns {object} Site products
 */
export function getSiteProducts( state ) {
	return state.jetpack.siteProducts.items;
}

/**
 * Returns a Jetpack product if it exists in the state.
 *
 * @param   {object} state - Global state tree
 * @param   {string} slug  - Product slug
 * @returns {object} Product
 */
export function getSiteProduct( state, slug ) {
	return state.jetpack.siteProducts.items?.[ slug ];
}

/**
 * Returns the monthly cost of a product. This also takes into account intro offers.
 *
 * @see     pbNhbs-53E-p2
 * @todo    Fix how we calculate the price in the future.
 * @param   {object} state - Global state tree
 * @param   {string} slug  - Product slug
 * @returns {number}  Monthly cost of a product
 */
export function getSiteProductMonthlyCost( state, slug ) {
	const product = getSiteProduct( state, slug );
	const price = product?.introductory_offer?.cost_per_interval || product?.cost;

	return Math.ceil( ( price / 12 ) * 100 ) / 100;
}

/**
 * Returns the discount of a product price. It bases the discount on intro offers with a yearly interval
 *
 * @param   {object} state - Global state tree
 * @param   {string} slug  - Product slug
 * @returns {number} Discount of a product price or 0 if there is no discount
 */
export function getSiteProductYearlyDiscount( state, slug ) {
	const product = getSiteProduct( state, slug );
	const price = product?.introductory_offer?.cost_per_interval;
	const isYearDiscount =
		product?.introductory_offer?.interval_unit === 'year' &&
		product?.introductory_offer?.interval_count === 1;

	return isYearDiscount && price ? Math.ceil( ( price / product?.cost ) * 100 ) : 0;
}
