/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { REST_API_SITE_PRODUCTS_ENDPOINT } from './constants';

/*
 * Action constants
 */
const SET_PURCHASES_IS_FETCHING = 'SET_PURCHASES_IS_FETCHING';
const FETCH_PURCHASES = 'FETCH_PURCHASES';
const SET_PURCHASES = 'SET_PURCHASES';
const SET_PRODUCT_ACTION_ERROR = 'SET_PRODUCT_ACTION_ERROR';
const ACTIVATE_PRODUCT = 'ACTIVATE_PRODUCT';
const DEACTIVATE_PRODUCT = 'DEACTIVATE_PRODUCT';
const SET_FETCHING_PRODUCT_STATUS = 'SET_FETCHING_PRODUCT_STATUS';
const SET_PRODUCT_STATUS = 'SET_PRODUCT_STATUS';

const setPurchasesIsFetching = isFetching => {
	return { type: SET_PURCHASES_IS_FETCHING, isFetching };
};

const fetchPurchases = () => {
	return { type: FETCH_PURCHASES };
};

const setPurchases = purchases => {
	return { type: SET_PURCHASES, purchases };
};

const setProductStatus = ( productId, status ) => {
	return { type: SET_PRODUCT_STATUS, productId, status };
};

const setIsFetchingProductStatus = ( productId, isFetching ) => {
	return { type: SET_FETCHING_PRODUCT_STATUS, productId, isFetching };
};

const setProductActionError = error => {
	return { type: SET_PRODUCT_ACTION_ERROR, error };
};

/**
 * Side effect action which will sync
 * the `status` state of the product with the server.
 *
 * @param {string}   productId      - My Jetpack product ID.
 * @param {object}   data           - POST Action data. eg: { activate: true }
 * @param {object}   store          - Redux store.
 * @param {object}   store.select   - Redux store select.
 * @param {Function} store.dispatch - Redux store dispatch.
 * @returns {Promise}               - Promise which resolves when the product status is updated.
 */
function requestProductStatus( productId, data, { select, dispatch } ) {
	return new Promise( ( resolve, reject ) => {
		// Check valid product.
		const isValid = select.isValidProduct( productId );
		if ( ! isValid ) {
			return dispatch(
				setProductActionError( {
					code: 'invalid_product',
					message: __( 'Invalid product name', 'jetpack-my-jetpack' ),
				} )
			);
		}

		dispatch( setIsFetchingProductStatus( productId, true ) );

		// Activate/deactivate product.
		return apiFetch( {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
			method: 'POST',
			data,
		} )
			.then( status => {
				dispatch( setIsFetchingProductStatus( productId, false ) );
				dispatch( setProductStatus( productId, status ) );
				resolve( status );
			} )
			.catch( error => {
				dispatch( setProductActionError( error ) );
				reject( error );
				dispatch( setIsFetchingProductStatus( productId, false ) );
			} );
	} );
}

/**
 * Side effect action which will sync
 * the `activate` state of the product with the server.
 *
 * @param {string} productId - My Jetpack product ID.
 * @returns {Promise}        - Promise which resolves when the product status is activated.
 */
const activateProduct = productId => async store => {
	return await requestProductStatus( productId, { activate: true }, store );
};

/**
 * Side effect action which will sync
 * the `deactivate` state of the product with the server.
 *
 * @param {string} productId - My Jetpack product ID.
 * @returns {Promise}        - Promise which resolves when the product status is deactivated.
 */
const deactivateProduct = productId => async store => {
	return await requestProductStatus( productId, { activate: false }, store );
};

const productActions = {
	activateProduct,
	deactivateProduct,
};

const actions = {
	setPurchasesIsFetching,
	fetchPurchases,
	setPurchases,
	...productActions,
};

export {
	SET_PURCHASES_IS_FETCHING,
	FETCH_PURCHASES,
	SET_PURCHASES,
	SET_PRODUCT_ACTION_ERROR,
	ACTIVATE_PRODUCT,
	DEACTIVATE_PRODUCT,
	SET_FETCHING_PRODUCT_STATUS,
	SET_PRODUCT_STATUS,
	actions as default,
};
