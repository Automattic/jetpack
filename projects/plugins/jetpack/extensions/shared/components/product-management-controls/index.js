/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ProductManagementInspectorControl from './inspector-control';
import { jetpackMembershipProductsStore } from './store';
import ProductManagementToolbarControl from './toolbar-control';
import InvalidProductWarning from './invalid-product-warning';
import StripeConnectToolbarButton from '../stripe-connect-toolbar-button';

import './style.scss';

export default function ProductManagementControls( {
	allowCreateOneTimeInterval = true,
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
	const { connectUrl, isApiConnected, isSelectedProductInvalid, shouldUpgrade } = useSelect(
		select => {
			const { getConnectUrl, getShouldUpgrade, isApiStateConnected, isInvalidProduct } = select(
				jetpackMembershipProductsStore
			);
			return {
				connectUrl: getConnectUrl(),
				isApiConnected: isApiStateConnected(),
				isSelectedProductInvalid: isInvalidProduct( selectedProductId ),
				shouldUpgrade: getShouldUpgrade(),
			};
		}
	);

	if ( shouldUpgrade ) {
		return null;
	}

	return (
		<>
			{ ! isApiConnected && !! connectUrl && (
				<BlockControls group="block">
					<StripeConnectToolbarButton blockName="premium-content" connectUrl={ connectUrl } />
				</BlockControls>
			) }
			{ isApiConnected && (
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
				</>
			) }
			{ isApiConnected && isSelectedProductInvalid && <InvalidProductWarning /> }
		</>
	);
}
