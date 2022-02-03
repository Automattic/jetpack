/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import { mapObjectKeysToCamel } from '../../utils/to-camel';

/**
 * React custom hook to deal with a My Jetpack product.
 *
 * @param {string} productId - My Jetpack product ID.
 * @returns {object}         - Site product data.
 */
export function useProduct( productId ) {
	const { activateProduct, deactivateProduct } = useDispatch( STORE_ID );
	const detail = useSelect( select => select( STORE_ID ).getProduct( productId ) );

	return {
		activate: () => activateProduct( productId ),
		deactivate: () => deactivateProduct( productId ),
		productsList: useSelect( select => select( STORE_ID ).getProducts() ),
		detail: mapObjectKeysToCamel( detail, true ),
		isActive: detail.status === 'active',
		isFetching: useSelect( select => select( STORE_ID ).isFetching( productId ) ),
		status: detail.status, // shorthand. Consider to remove.
	};
}
