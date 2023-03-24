import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the site purchases data.
 *
 * @returns {object} site purchases data
 */
export default function usePurchases() {
	return {
		purchases: useSelect( select => select( STORE_ID ).getPurchases() ),
		isFetchingPurchases: useSelect( select => select( STORE_ID ).isRequestingPurchases() ),
	};
}
