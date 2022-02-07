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
const SET_IS_FETCHING_PRODUCT = 'SET_IS_FETCHING_PRODUCT';
const SET_PRODUCT = 'SET_PRODUCT';
const SET_PRODUCT_REQUEST_ERROR = 'SET_PRODUCT_REQUEST_ERROR';
const ACTIVATE_PRODUCT = 'ACTIVATE_PRODUCT';
const DEACTIVATE_PRODUCT = 'DEACTIVATE_PRODUCT';
const SET_PRODUCT_STATUS = 'SET_PRODUCT_STATUS';

const SET_GLOBAL_NOTICE = 'SET_GLOBAL_NOTICE';
const CLEAN_GLOBAL_NOTICE = 'CLEAN_GLOBAL_NOTICE';

const setPurchasesIsFetching = isFetching => {
	return { type: SET_PURCHASES_IS_FETCHING, isFetching };
};

const fetchPurchases = () => {
	return { type: FETCH_PURCHASES };
};

const setPurchases = purchases => {
	return { type: SET_PURCHASES, purchases };
};

const setProduct = product => ( { type: SET_PRODUCT, product } );

const setRequestProductError = ( productId, error ) => ( {
	type: SET_PRODUCT_REQUEST_ERROR,
	productId,
	error,
} );

const setProductStatus = ( productId, status ) => {
	return { type: SET_PRODUCT_STATUS, productId, status };
};

/**
 * Action that set the `isFetching` state of the product,
 * when the client hits the server.
 *
 * @param {string} productId   - My Jetpack product ID.
 * @param {boolean} isFetching - True if the product is being fetched. Otherwise, False.
 * @returns {object}           - Redux action.
 */
function setIsFetchingProduct( productId, isFetching ) {
	return {
		type: SET_IS_FETCHING_PRODUCT,
		productId,
		isFetching,
	};
}

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
			dispatch( setProductStatus( productId, 'error' ) );
			return dispatch(
				setRequestProductError( productId, {
					code: 'invalid_product',
					message: __( 'Invalid product name', 'jetpack-my-jetpack' ),
				} )
			);
		}

		const method = data.activate ? 'POST' : 'DELETE';
		dispatch( setIsFetchingProduct( productId, true ) );

		// Activate/deactivate product.
		return apiFetch( {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
			method,
			data,
		} )
			.then( freshProduct => {
				dispatch( setIsFetchingProduct( productId, false ) );
				dispatch( setProduct( freshProduct ) );
				resolve( status );
			} )
			.catch( error => {
				dispatch( setProductStatus( productId, 'error' ) );
				dispatch( setRequestProductError( productId, error ) );
				reject( error );
				dispatch( setIsFetchingProduct( productId, false ) );
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
	setProduct,
	activateProduct,
	deactivateProduct,
	setIsFetchingProduct,
	setRequestProductError,
};

const noticeActions = {
	setGlobalNotice: ( message, options ) => ( {
		type: 'SET_GLOBAL_NOTICE',
		message,
		options,
	} ),
	cleanGlobalNotice: () => ( { type: 'CLEAN_GLOBAL_NOTICE' } ),
};

const actions = {
	setPurchasesIsFetching,
	fetchPurchases,
	setPurchases,
	...noticeActions,
	...productActions,
};

export {
	SET_PURCHASES_IS_FETCHING,
	FETCH_PURCHASES,
	SET_PURCHASES,
	SET_PRODUCT,
	SET_PRODUCT_REQUEST_ERROR,
	ACTIVATE_PRODUCT,
	DEACTIVATE_PRODUCT,
	SET_IS_FETCHING_PRODUCT,
	SET_PRODUCT_STATUS,
	SET_GLOBAL_NOTICE,
	CLEAN_GLOBAL_NOTICE,
	actions as default,
};
