/**
 * External dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
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
	const {
		activateProduct,
		deactivateProduct,
		installStandalonePluginForProduct,
		deactivateStandalonePluginForProduct,
	} = useDispatch( STORE_ID );
	const detail = useSelect( select => select( STORE_ID ).getProduct( productId ) );

	return {
		activate: () => activateProduct( productId ),
		deactivate: () => deactivateProduct( productId ),
		deactivateStandalonePlugin: () => deactivateStandalonePluginForProduct( productId ),
		installStandalonePlugin: () => installStandalonePluginForProduct( productId ),
		productsList: useSelect( select => select( STORE_ID ).getProducts() ),
		detail,
		isActive: detail.status === 'active',
		isFetching: useSelect( select => select( STORE_ID ).isFetching( productId ) ),
		stats: useSelect( select => select( STORE_ID ).getProductStats( productId ) ),
	};
}
