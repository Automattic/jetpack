import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the site purchases data.
 *
 * @returns {object} site purchases data
 */
export default function usePurchases() {
	const { purchases, isFetchingPurchases } = useSelect( select => {
		const { getPurchases, isRequestingPurchases } = select( STORE_ID );

		return {
			purchases: getPurchases(),
			isFetchingPurchases: isRequestingPurchases(),
		};
	} );

	return {
		purchases,
		isFetchingPurchases,
	};
}
