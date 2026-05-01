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

export const getTotalEmailsSentCount = state => state.totalEmailsSentCount;

export const getNewsletterCategories = state => state.newsletterCategories.categories;

export const getNewsletterCategoriesEnabled = state => state.newsletterCategories.enabled;

const DEFAULT_POST_EMAIL_SENT_STATE = { email_sent_at: null, stats_on_send: null };
export const getPostEmailSentState = ( state, postId ) => {
	if ( ! postId ) {
		return DEFAULT_POST_EMAIL_SENT_STATE;
	}
	return state.postEmailSentState?.[ postId ] ?? DEFAULT_POST_EMAIL_SENT_STATE;
};

export const getAlreadySentPostModifiedInSession = ( state, postId ) =>
	!! ( state.alreadySentPostModifiedInSession && state.alreadySentPostModifiedInSession[ postId ] );

export const getPublishedWithEmailEnabledInSession = ( state, postId ) =>
	!! (
		state.publishedWithEmailEnabledInSession && state.publishedWithEmailEnabledInSession[ postId ]
	);

export const hasInvalidProducts = ( state, selectedProductIds ) => {
	return (
		!! selectedProductIds &&
		selectedProductIds.some( productId => isInvalidProduct( state, productId ) )
	);
};
