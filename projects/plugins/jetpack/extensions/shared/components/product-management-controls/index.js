/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { jetpackMembershipProductsStore } from './store';
import useProducts from './use-products';
import ProductManagementInspectorControl from './inspector-control';
import ProductManagementToolbarControl from './toolbar-control';
import InvalidProductWarning from './invalid-product-warning';

import './style.scss';

export default function ProductManagementControls( {
	allowOneTimeInterval = true,
	isVisible = true,
	preventFetchingProducts = false,
	selectedProductId,
	selectedProductIdAttribute,
	setAttributes,
} ) {
	const isInvalidProduct = useSelect( select =>
		select( jetpackMembershipProductsStore ).isInvalidProduct( selectedProductId )
	);
	const { fetchProducts, saveProduct, selectProduct } = useProducts(
		selectedProductIdAttribute,
		setAttributes
	);

	useEffect( () => {
		if ( preventFetchingProducts ) {
			fetchProducts( selectedProductId );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return isVisible ? (
		<>
			<ProductManagementInspectorControl
				allowOneTimeInterval={ allowOneTimeInterval }
				saveProduct={ saveProduct }
			/>
			<ProductManagementToolbarControl
				selectedProductId={ selectedProductId }
				selectProduct={ selectProduct }
			/>
			{ isInvalidProduct && <InvalidProductWarning /> }
		</>
	) : null;
}
