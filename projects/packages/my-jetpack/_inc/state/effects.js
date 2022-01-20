/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { setProductActionError, setProductActivated } from './actions';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from './constants';
import { isValidProduct } from './selectors';

/**
 * Effect handler which will sync
 * the product `actuve` status with the server.
 *
 * @param {object} action  - Action which had initiated the effect handler.
 * @param {object} store   - Store instance.
 */
function activateProduct( action, store ) {
	const { productId } = action;
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

	apiFetch( {
		path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
		method: 'POST',
		data: {
			action: 'activate',
		},
	} )
		.then( () => dispatch( setProductActivated( productId ) ) )
		.catch( error => dispatch( setProductActionError( error ) ) );
}

export default {
	ACTIVATE_PRODUCT: activateProduct,
};
