/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { jetpackMembershipProductsStore } from './store';

export default function useProducts( {
	selectedProductId = 0,
	setSelectedProductId = () => {},
	shouldSkipResolver = false,
} ) {
	const products = useSelect( select => {
		const { getProducts, getProductsNoResolver } = select( jetpackMembershipProductsStore );
		return {
			products: shouldSkipResolver
				? getProductsNoResolver()
				: getProducts( selectedProductId, setSelectedProductId ),
		};
	}, [] );

	const { apiState, connectUrl, shouldUpgrade } = useSelect( select => {
		const { getApiState, getConnectUrl, getShouldUpgrade } = select(
			jetpackMembershipProductsStore
		);
		return {
			apiState: getApiState(),
			connectUrl: getConnectUrl(),
			shouldUpgrade: getShouldUpgrade(),
		};
	} );

	return { apiState, connectUrl, products, shouldUpgrade };
}
