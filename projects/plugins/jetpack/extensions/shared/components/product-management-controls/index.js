/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PRODUCT_TYPE_PAYMENT_PLAN } from './constants';
import ProductManagementInspectorControl from './inspector-control';
import ProductManagementToolbarControl from './toolbar-control';
import InvalidProductWarning from './invalid-product-warning';
import StripeConnectToolbarButton from '../stripe-connect-toolbar-button';
import { store as membershipProductsStore } from '../../../store/membership-products';

import './style.scss';

export default function ProductManagementControls( {
	allowCreateOneTimeInterval = true,
	blockName,
	productType = PRODUCT_TYPE_PAYMENT_PLAN,
	selectedProductId = 0,
	setSelectedProductId = () => {},
} ) {
	const products = useSelect(
		select =>
			select( membershipProductsStore ).getProducts(
				productType,
				selectedProductId,
				setSelectedProductId
			),
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
						productType={ productType }
						setSelectedProductId={ setSelectedProductId }
					/>
					<ProductManagementToolbarControl
						products={ products }
						productType={ productType }
						selectedProductId={ selectedProductId }
						setSelectedProductId={ setSelectedProductId }
					/>
				</>
			) }
			{ isApiConnected && isSelectedProductInvalid && <InvalidProductWarning /> }
		</>
	);
}
