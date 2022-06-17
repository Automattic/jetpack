import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook that exposes data about Product,
 * as well as methods to manipulate it.
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
		detail,
		isActive: detail.status === 'active',
		isFetching: useSelect( select => select( STORE_ID ).isFetching( productId ) ),
		status: detail.status, // shorthand. Consider to remove.
	};
}
