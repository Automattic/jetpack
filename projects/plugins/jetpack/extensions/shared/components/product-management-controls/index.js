import { BlockControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as membershipProductsStore } from '../../../store/membership-products';
import StripeConnectToolbarButton from '../stripe-connect-toolbar-button';
import { PRODUCT_TYPE_PAYMENT_PLAN } from './constants';
import { ProductManagementContext } from './context';
import ProductManagementInspectorControl from './inspector-control';
import InvalidProductWarning from './invalid-product-warning';
import ProductManagementToolbarControl from './toolbar-control';

import './style.scss';

export default function ProductManagementControls( {
	blockName,
	clientId,
	productType = PRODUCT_TYPE_PAYMENT_PLAN,
	selectedProductId = 0,
	setSelectedProductId = () => {},
} ) {
	const products = useSelect( select =>
		select( membershipProductsStore )
			?.getProducts()
			.filter( product => ! product.subscribe_as_site_subscriber )
	);

	const { connectUrl, isApiConnected, isSelectedProductInvalid } = useSelect( select => {
		const { getConnectUrl, isApiStateConnected, isInvalidProduct } =
			select( membershipProductsStore );
		return {
			connectUrl: getConnectUrl(),
			isApiConnected: isApiStateConnected(),
			isSelectedProductInvalid: isInvalidProduct( selectedProductId ),
		};
	} );

	// Don't display this on free sites with Stripe disconnected.
	if ( ! isApiConnected ) {
		return null;
	}

	const context = {
		blockName,
		clientId,
		products,
		productType,
		selectedProductId,
		setSelectedProductId,
	};

	return (
		<ProductManagementContext.Provider value={ context }>
			{ ! isApiConnected && !! connectUrl && (
				<BlockControls __experimentalShareWithChildBlocks group="block">
					<StripeConnectToolbarButton blockName={ blockName } connectUrl={ connectUrl } />
				</BlockControls>
			) }
			{ isApiConnected && (
				<>
					<ProductManagementInspectorControl />
					<ProductManagementToolbarControl />
				</>
			) }
			{ isApiConnected && isSelectedProductInvalid && <InvalidProductWarning /> }
		</ProductManagementContext.Provider>
	);
}
