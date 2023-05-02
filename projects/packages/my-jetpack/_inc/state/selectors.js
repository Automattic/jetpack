import { PRODUCT_STATUSES } from '../components/product-card';
import { mapObjectKeysToCamel } from '../utils/to-camel';

export const getProducts = state => state.products?.items || {};

export const getProductNames = state => Object.keys( getProducts( state ) );

export const getProduct = ( state, productId ) => {
	const stateProduct = getProducts( state )?.[ productId ] || {};

	const product = mapObjectKeysToCamel( stateProduct, true );
	product.standalonePluginInfo = mapObjectKeysToCamel( product.standalonePluginInfo || {}, true );
	product.pricingForUi = mapObjectKeysToCamel( product.pricingForUi || {}, true );
	product.pricingForUi.introductoryOffer = product.pricingForUi.isIntroductoryOffer
		? mapObjectKeysToCamel( product.pricingForUi.introductoryOffer, true )
		: null;

	// Camelize object keys for each tier in pricingForUi
	if ( product.pricingForUi?.tiers ) {
		product.pricingForUi.tiers = mapObjectKeysToCamel( product.pricingForUi.tiers, true );
		product.pricingForUi.tiers = Object.keys( product.pricingForUi.tiers ).reduce(
			( result, tierKey ) => {
				const tier = mapObjectKeysToCamel( product.pricingForUi.tiers[ tierKey ], true ) || {};
				result[ tierKey ] = {
					...tier,
					introductoryOffer: tier?.isIntroductoryOffer
						? mapObjectKeysToCamel( tier?.introductoryOffer, true )
						: null,
				};
				return result;
			},
			{}
		);
	}

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
	isRequestingPurchases: state => state.purchases?.isFetching || false,
};

const chatAvailabilitySelectors = {
	getChatAvailability: state => state.chatAvailability.isAvailable,
	isRequestingChatAvailability: state => state.chatAvailability.isFetching,
};

const availableLicensesSelectors = {
	getAvailableLicenses: state => state.availableLicenses?.items || [],
	isFetchingAvailableLicenses: state => state.availableLicenses?.isFetching || false,
};

const pluginSelectors = {
	hasStandalonePluginInstalled: state =>
		Object.values( state.plugins ).filter(
			plugin =>
				[
					'jetpack-backup',
					'jetpack-boost',
					'jetpack-protect',
					'jetpack-search',
					'jetpack-social',
					'jetpack-videopress',
				].indexOf( plugin.TextDomain ) >= 0
		).length > 0,
};

const noticeSelectors = {
	getGlobalNotice: state => state.notices?.global,
};

const getProductStats = ( state, productId ) => {
	return state.stats?.items?.[ productId ];
};

const isFetchingProductStats = ( state, productId ) => {
	return state.stats?.isFetching?.[ productId ] || false;
};

const productStatsSelectors = {
	getProductStats,
	isFetchingProductStats,
};

const selectors = {
	...productSelectors,
	...purchasesSelectors,
	...chatAvailabilitySelectors,
	...availableLicensesSelectors,
	...noticeSelectors,
	...pluginSelectors,
	...productStatsSelectors,
};

export default selectors;
