import { API_STATE_CONNECTED, API_STATE_LOADING } from './constants';

export const getApiState = state => state.apiState;

export const getConnectUrl = state => state.connectUrl;

export const getConnectedAccountDefaultCurrency = state => state.connectedAccountDefaultCurrency;

export const getProducts = state => state.products;

export const getProductsNoResolver = state => getProducts( state );

export const getProduct = ( state, productId ) =>
	getProducts( state ).find( product => product.id === productId );

export const getNewsletterProducts = state =>
	state.products.filter( product => product.subscribe_as_site_subscriber );

export const getSiteSlug = state => state.siteSlug;

export const isApiStateConnected = state => state.apiState === API_STATE_CONNECTED;

export const isApiStateLoading = state => state.apiState === API_STATE_LOADING;

export const isInvalidProduct = ( state, productId ) =>
	!! productId && ! getProduct( state, productId );

export const getSubscriberCounts = state => state.subscriberCounts;
