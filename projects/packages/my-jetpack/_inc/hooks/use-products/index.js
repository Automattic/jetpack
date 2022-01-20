/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to deal with the site products.
 *
 * @returns {object} site products data
 */
export function useProducts() {
	const { activateProduct: activate, deactivateProduct: deactivate } = useDispatch( STORE_ID );

	return {
		list: useSelect( select => select( STORE_ID ).getProducts() ),
		activate,
		deactivate,
	};
}
