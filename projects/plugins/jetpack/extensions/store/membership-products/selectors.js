import { API_STATE_CONNECTED, API_STATE_LOADING, TYPE_TIER } from './constants';

export const getApiState = state => state.apiState;

export const getConnectUrl = state => state.connectUrl;

export const getConnectedAccountDefaultCurrency = state => state.connectedAccountDefaultCurrency;

export const getProducts = state => state.products;

export const getProductsNoResolver = state => getProducts( state );

export const getProduct = ( state, productId ) =>
	getProducts( state ).find( product => product.id === productId );

export const getSelectedProducts = ( state, selectedProductIds ) =>
	getProducts( state ).filter( product => selectedProductIds.includes( product.id ) );

export const getNewsletterTierProducts = state =>
	state.products.filter( product => product.type === TYPE_TIER );

export const getSiteSlug = state => state.siteSlug;

export const isApiStateConnected = state => state.apiState === API_STATE_CONNECTED;

export const isApiStateLoading = state => state.apiState === API_STATE_LOADING;

export const isInvalidProduct = ( state, productId ) =>
	!! productId && ! getProduct( state, productId );

export const getSubscriberCounts = state => state.subscriberCounts;

export const getNewsletterCategories = state => state.newsletterCategories.categories;

export const getNewsletterCategoriesEnabled = state => state.newsletterCategories.enabled;

export const getNewsletterCategoriesSubscriptionsCount = state =>
	state.newsletterCategoriesSubscriptionsCount;

export const hasInvalidProducts = ( state, selectedProductIds ) => {
	return (
		!! selectedProductIds &&
		selectedProductIds.some( productId => isInvalidProduct( state, productId ) )
	);
};
