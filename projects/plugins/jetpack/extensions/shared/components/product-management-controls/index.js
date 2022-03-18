/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ProductManagementInspectorControl from './inspector-control';
import ProductManagementToolbarControl from './toolbar-control';
import InvalidProductWarning from './invalid-product-warning';
import StripeConnectToolbarButton from '../stripe-connect-toolbar-button';
import { store as membershipProductsStore } from '../../../store/membership-products';

import './style.scss';

export default function ProductManagementControls( {
	allowCreateOneTimeInterval = true,
	blockName,
	selectedProductId = 0,
	setSelectedProductId = () => {},
} ) {
	const products = useSelect(
		select =>
			select( membershipProductsStore ).getProducts( selectedProductId, setSelectedProductId ),
		[]
	);
	const { connectUrl, isApiConnected, isSelectedProductInvalid, shouldUpgrade } = useSelect(
		select => {
			const { getConnectUrl, getShouldUpgrade, isApiStateConnected, isInvalidProduct } = select(
				membershipProductsStore
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
					<StripeConnectToolbarButton blockName={ blockName } connectUrl={ connectUrl } />
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
