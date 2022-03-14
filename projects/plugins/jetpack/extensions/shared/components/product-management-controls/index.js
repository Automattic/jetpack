/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './store';
import useProducts from './use-product';
import ProductManagementInspectorControl from './inspector-control';
import ProductManagementToolbarControl from './toolbar-control';

import './style.scss';

export default function ProductManagementControls( {
	allowOneTimeInterval = true,
	isVisible = true,
	selectedProductId,
	selectedProductIdAttribute,
	setAttributes,
} ) {
	const { fetchProducts, saveProduct, selectProduct } = useProducts(
		selectedProductIdAttribute,
		setAttributes
	);

	useEffect( () => {
		if ( isVisible ) {
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
		</>
	) : null;
}
