/**
 * Internal dependencies
 */
import './store';
import ProductManagementInspectorControl from './inspector-control';
import ProductManagementToolbarControl from './toolbar-control';

import './style.scss';

export default function ProductManagementControl( {
	saveProduct,
	selectProduct,
	selectedProductId,
} ) {
	return (
		<>
			<ProductManagementInspectorControl saveProduct={ saveProduct } />
			<ProductManagementToolbarControl
				selectedProductId={ selectedProductId }
				selectProduct={ selectProduct }
			/>
		</>
	);
}
