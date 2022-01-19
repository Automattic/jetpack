/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

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
	return {
		list: useSelect( select => select( STORE_ID ).getProducts() ),
		enable: () => {},
		disable: () => {},
	};
}
