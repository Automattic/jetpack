/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { API_STATE_CONNECTED } from './constants';
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
	const { apiState, connectUrl, isSelectedProductInvalid, shouldUpgrade } = useSelect( select => {
		const { getApiState, getConnectUrl, getShouldUpgrade, isInvalidProduct } = select(
			jetpackMembershipProductsStore
		);
		return {
			apiState: getApiState(),
			connectUrl: getConnectUrl(),
			isSelectedProductInvalid: isInvalidProduct( selectedProductId ),
			shouldUpgrade: getShouldUpgrade(),
		};
	} );

	return (
		<>
			{ ! shouldUpgrade && apiState !== API_STATE_CONNECTED && connectUrl && (
				<BlockControls group="block">
					<StripeConnectToolbarButton blockName="premium-content" connectUrl={ connectUrl } />
				</BlockControls>
			) }
			{ apiState === API_STATE_CONNECTED && (
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
			{ isSelectedProductInvalid && <InvalidProductWarning /> }
		</>
	);
}
