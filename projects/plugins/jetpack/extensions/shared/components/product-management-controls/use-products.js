/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { jetpackMembershipProductsStore } from './store';

export default function useProducts( selectedProductId = 0, setSelectedProductId = () => {} ) {
	const products = useSelect(
		select =>
			select( jetpackMembershipProductsStore ).getProducts(
				selectedProductId,
				setSelectedProductId
			),
		[]
	);

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
