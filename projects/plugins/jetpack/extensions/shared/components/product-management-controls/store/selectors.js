export const getAllProperties = state => ( {
	apiState: state.apiState,
	connectUrl: state.connectUrl,
	shouldUpgrade: state.shouldUpgrade,
	siteSlug: state.siteSlug,
} );

export const getApiState = state => state.apiState;

export const getConnectUrl = state => state.connectUrl;

export const getProducts = state => state.products;

export const getProduct = ( state, productId ) =>
	state.products.find( product => product.id === productId );

export const getShouldUpgrade = state => state.getShouldUpgrade;

export const getSiteSlug = state => state.siteSlug;
