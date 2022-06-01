import { PRODUCT_STATUSES } from '../components/product-card';
import { mapObjectKeysToCamel } from '../utils/to-camel';

export const getProducts = state => state.products?.items || {};

export const getProductNames = state => Object.keys( getProducts( state ) );

export const getProduct = ( state, productId ) => {
	const stateProduct = getProducts( state )?.[ productId ] || {};

	const product = mapObjectKeysToCamel( stateProduct, true );
	product.pricingForUi = mapObjectKeysToCamel( product.pricingForUi || {}, true );
	product.features = product.features || [];
	product.supportedProducts = product.supportedProducts || [];

	product.pricingForUi.fullPricePerMonth =
		Math.ceil( ( product.pricingForUi.fullPrice / 12 ) * 100 ) / 100;

	product.pricingForUi.discountPricePerMonth =
		Math.ceil( ( product.pricingForUi.discountPrice / 12 ) * 100 ) / 100;

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
