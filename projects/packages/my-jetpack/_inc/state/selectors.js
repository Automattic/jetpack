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
		product.pricingForUi.productTerm === 'year'
			? Math.round( ( product.pricingForUi.fullPrice / 12 ) * 100 ) / 100
			: product.pricingForUi.fullPrice;

	product.pricingForUi.discountPricePerMonth =
		product.pricingForUi.productTerm === 'year'
			? Math.round( ( product.pricingForUi.discountPrice / 12 ) * 100 ) / 100
			: product.pricingForUi.discountPrice;

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

const backupRewindableEventsSelectors = {
	getBackupRewindableEvents: state => state.backupRewindableEvents?.items || {},
	isFetchingBackupRewindableEvents: state => state.backupRewindableEvents?.isFetching || false,
};

const countBackupItemsSelectors = {
	getCountBackupItems: state => state.countBackupItems?.items || {},
	isFetchingCountBackupItems: state => state.countBackupItems.isFetching || false,
};

const chatAvailabilitySelectors = {
	getChatAvailability: state => state.chatAvailability.isAvailable,
	isRequestingChatAvailability: state => state.chatAvailability.isFetching,
};

const chatAuthenticationSelectors = {
	getChatAuthentication: state => state.chatAuthentication.jwt,
	isRequestingChatAuthentication: state => state.chatAuthentication.isFetching,
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

const getStatsCounts = state => {
	return state.statsCounts?.data;
};

const isFetchingStatsCounts = state => {
	return state.statsCounts?.isFetching || false;
};

const statsCountsSelectors = {
	getStatsCounts,
	isFetchingStatsCounts,
};

const getWelcomeBannerHasBeenDismissed = state => {
	return state.welcomeBanner?.hasBeenDismissed;
};

const selectors = {
	...productSelectors,
	...chatAvailabilitySelectors,
	...chatAuthenticationSelectors,
	...availableLicensesSelectors,
	...noticeSelectors,
	...pluginSelectors,
	...productStatsSelectors,
	...backupRewindableEventsSelectors,
	...countBackupItemsSelectors,
	...statsCountsSelectors,
	getWelcomeBannerHasBeenDismissed,
};

export default selectors;
