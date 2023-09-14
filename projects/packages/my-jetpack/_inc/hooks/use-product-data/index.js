import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the product data
 *
 * @returns {object} product data
 */

/**
 * React custom hook to get the product data
 *
 * @returns {object} product data
 */
export default function useProductData() {
	const { productData, isQueryingProductData } = useSelect( select => {
		const { getProductData, isFetchingProductData } = select( STORE_ID );

		return {
			productData: getProductData(),
			isQueryingProductData: isFetchingProductData(),
		};
	} );

	return {
		productData,
		isQueryingProductData,
	};
}
