export const getProducts = state => state.products;

export const getProduct = ( state, productId ) =>
	state.products.find( product => product.id === productId );

export const getApiState = state => state.apiState;

export const getSiteslug = state => state.siteSlug;
