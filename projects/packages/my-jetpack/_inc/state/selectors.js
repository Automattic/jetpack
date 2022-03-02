/**
 * Internal dependencies
 */
import { mapObjectKeysToCamel } from '../utils/to-camel';
import { PRODUCT_STATUSES } from '../components/product-card';

export const getProducts = state => state.products?.items || {};

export const getProductNames = state => Object.keys( getProducts( state ) );

export const getProduct = ( state, productId ) => {
	const stateProduct = getProducts( state )?.[ productId ] || {};

	const product = mapObjectKeysToCamel( stateProduct, true );
	product.pricingForUi = mapObjectKeysToCamel( product.pricingForUi || {}, true );

	// Default values.
	product.features = product.features || [];
	product.supportedProducts = product.supportedProducts || [];

	// Compute pricing for UI.
	const { pricingForUi } = product;

	if ( pricingForUi?.fullPrice ) {
		pricingForUi.fullPricePerMonth = Math.ceil( ( pricingForUi.fullPrice / 12 ) * 100 ) / 100;
	}

	if ( pricingForUi?.discountPrice ) {
		pricingForUi.discountPricePerMonth =
			Math.ceil( ( pricingForUi.discountPrice / 12 ) * 100 ) / 100;
		pricingForUi.discount = Math.ceil(
			( pricingForUi.discountPricePerMonth / pricingForUi.fullPricePerMonth ) * 100
		);
	}

	return product;
};

export const isValidProduct = ( state, productId ) =>
	getProductNames( state ).includes( productId );

export const getProductsThatRequiresUserConnection = state => {
	const products = getProducts( state );

	return Object.keys( products ).reduce( ( current, product ) => {
		const currentProduct = products[ product ];
		const requires =
			currentProduct?.requires_user_connection &&
			( currentProduct?.status === PRODUCT_STATUSES.ACTIVE ||
				currentProduct?.status === PRODUCT_STATUSES.ERROR );
		if ( requires ) {
			current.push( currentProduct?.name );
		}
		return current;
	}, [] );
};

const productSelectors = {
	getProducts,
	getProductNames,
	getProduct,
	isValidProduct,
	isFetching: ( state, productId ) => state.products?.isFetching?.[ productId ] || false,
	getProductsThatRequiresUserConnection,
};

const purchasesSelectors = {
	getPurchases: state => state.purchases?.items || [],
	isRequestingPurchases: state => state.isRequestingPurchases || false,
};

const noticeSelectors = {
	getGlobalNotice: state => state.notices?.global,
};

const selectors = {
	...productSelectors,
	...purchasesSelectors,
	...noticeSelectors,
};

export default selectors;
