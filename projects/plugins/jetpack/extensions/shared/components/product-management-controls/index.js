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
	selectedProductIds = [],
	setSelectedProductIds = () => {},
} ) {
	const products = useSelect(
		select =>
			select( membershipProductsStore ).getProducts(
				productType,
				selectedProductIds,
				setSelectedProductIds
			),
		[]
	);
	const { connectUrl, isApiConnected, areSelectedProductsInvalid, shouldUpgrade } = useSelect(
		select => {
			const { getConnectUrl, getShouldUpgrade, isApiStateConnected, hasInvalidProducts } = select(
				membershipProductsStore
			);
			return {
				connectUrl: getConnectUrl(),
				isApiConnected: isApiStateConnected(),
				areSelectedProductsInvalid: hasInvalidProducts( selectedProductIds ),
				shouldUpgrade: getShouldUpgrade(),
			};
		}
	);

	// Don't display this on free sites with Stripe disconnected.
	if ( shouldUpgrade && ! isApiConnected ) {
		return null;
	}

	const context = {
		blockName,
		clientId,
		products,
		productType,
		selectedProductIds,
		setSelectedProductIds,
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
			{ isApiConnected && areSelectedProductsInvalid && <InvalidProductWarning /> }
		</ProductManagementContext.Provider>
	);
}
