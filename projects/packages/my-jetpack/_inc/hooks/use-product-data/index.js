import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the product data
 *
 * @returns {object} product data
 */
export default function useProductData() {
	return {
		productData: useSelect( select => select( STORE_ID ).getProductData() ),
		fetchingProductData: useSelect( select => select( STORE_ID ).isFetchingProductData() ),
	};
}
