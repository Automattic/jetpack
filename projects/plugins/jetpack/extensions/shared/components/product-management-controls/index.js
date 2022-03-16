/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { jetpackMembershipProductsStore } from './store';
import ProductManagementInspectorControl from './inspector-control';
import ProductManagementToolbarControl from './toolbar-control';
import InvalidProductWarning from './invalid-product-warning';

import './style.scss';

export default function ProductManagementControls( {
	allowCreateOneTimeInterval = true,
	isVisible = true,
	selectedProductId = 0,
	setSelectedProductId = () => {},
} ) {
	const products = useSelect(
		select =>
			select( jetpackMembershipProductsStore ).getProducts(
				selectedProductId,
				setSelectedProductId
			),
		[]
	);
	const isSelectedProductInvalid = useSelect( select =>
		select( jetpackMembershipProductsStore ).isInvalidProduct( selectedProductId )
	);

	return isVisible ? (
		<>
			<ProductManagementInspectorControl
				allowCreateOneTimeInterval={ allowCreateOneTimeInterval }
				setSelectedProductId={ setSelectedProductId }
			/>
			<ProductManagementToolbarControl
				products={ products }
				selectedProductId={ selectedProductId }
				setSelectedProductId={ setSelectedProductId }
			/>
			{ isSelectedProductInvalid && <InvalidProductWarning /> }
		</>
	) : null;
}
