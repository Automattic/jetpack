/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ACTIVATE_PRODUCT,
	DEACTIVATE_PRODUCT,
	setProductActionError,
	setProductStatus,
} from './actions';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from './constants';
import { isValidProduct } from './selectors';

/**
 * Effect handler which will sync
 * the product `actuve` status with the server.
 *
 * @param {object} action  - Action which had initiated the effect handler.
 * @param {object} store   - Store instance.
 */
function requestProductStatus( action, store ) {
	const { productId, type } = action;
	const { getState, dispatch } = store;

	// Check valid product.
	const isValid = isValidProduct( getState(), productId );
	if ( ! isValid ) {
		dispatch(
			setProductActionError( {
				code: 'invalid_product',
				message: __( 'Invalid product name', 'jetpack-my-jetpack' ),
			} )
		);
		return;
	}

	// Body request.
	const data = { activate: type === ACTIVATE_PRODUCT };

	apiFetch( {
		path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
		method: 'POST',
		data,
	} )
		.then( status => dispatch( setProductStatus( productId, status ) ) )
		.catch( error => dispatch( setProductActionError( error ) ) );
}

export default {
	[ ACTIVATE_PRODUCT ]: requestProductStatus,
	[ DEACTIVATE_PRODUCT ]: requestProductStatus,
};
