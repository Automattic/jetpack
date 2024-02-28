/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';

/**
 * React custom hook that exposes data about Product,
 * as well as methods to manipulate it.
 *
 * @param {string} productId - My Jetpack product ID.
 * @returns {object}         - Site product data.
 */
export function useProduct( productId ) {
	return {
		stats: useSelect( select => select( STORE_ID ).getProductStats( productId ) ),
	};
}
