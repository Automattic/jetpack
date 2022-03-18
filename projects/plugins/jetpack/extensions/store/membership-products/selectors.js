/**
 * Internal dependencies
 */
import { API_STATE_CONNECTED } from './constants';

export const getAllProperties = state => ( {
	apiState: state.apiState,
	connectUrl: state.connectUrl,
	shouldUpgrade: state.shouldUpgrade,
	siteSlug: state.siteSlug,
} );

export const getApiState = state => state.apiState;

export const getConnectUrl = state => state.connectUrl;

export const getProducts = state => state.products;

export const getProductsNoResolver = state => getProducts( state );

export const getProduct = ( state, productId ) =>
	getProducts( state ).find( product => product.id === productId );

export const getShouldUpgrade = state => state.getShouldUpgrade;

export const getSiteSlug = state => state.siteSlug;

export const isApiStateConnected = state => state.apiState === API_STATE_CONNECTED;

export const isInvalidProduct = ( state, productId ) =>
	!! productId && ! getProduct( state, productId );
