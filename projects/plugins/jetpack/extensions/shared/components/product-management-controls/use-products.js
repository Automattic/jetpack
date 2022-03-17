/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as membershipProductsStore } from '../../../store/membership-products';

export default function useProducts( {
	selectedProductId = 0,
	setSelectedProductId = () => {},
	shouldSkipResolver = false,
} ) {
	const products = useSelect( select => {
		const { getProducts, getProductsNoResolver } = select( membershipProductsStore );
		return {
			products: shouldSkipResolver
				? getProductsNoResolver()
				: getProducts( selectedProductId, setSelectedProductId ),
		};
	}, [] );

	const { apiState, connectUrl, shouldUpgrade } = useSelect( select => {
		const { getApiState, getConnectUrl, getShouldUpgrade } = select( membershipProductsStore );
		return {
			apiState: getApiState(),
			connectUrl: getConnectUrl(),
			shouldUpgrade: getShouldUpgrade(),
		};
	} );

	return { apiState, connectUrl, products, shouldUpgrade };
}
