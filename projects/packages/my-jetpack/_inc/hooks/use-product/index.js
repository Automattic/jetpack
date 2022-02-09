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

	/*
	 * Re map object keys to camel case.
	 * Consider to improve this in the process.
	 */
	let detail = useSelect( select => select( STORE_ID ).getProduct( productId ) );
	detail = mapObjectKeysToCamel( detail, true );
	detail.pricingForUi = mapObjectKeysToCamel( detail.pricingForUi, true );

	return {
		activate: () => activateProduct( productId ),
		deactivate: () => deactivateProduct( productId ),
		productsList: useSelect( select => select( STORE_ID ).getProducts() ),
		detail,
		isActive: detail.status === 'active',
		isFetching: useSelect( select => select( STORE_ID ).isFetching( productId ) ),
		status: detail.status, // shorthand. Consider to remove.
	};
}
