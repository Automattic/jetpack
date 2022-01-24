export const getProducts = state => state.products?.items || {};
export const getProductNames = state => Object.keys( getProducts( state ) );
export const getProduct = ( state, productId ) => getProducts( state )?.[ productId ] || {};
export const isValidProduct = ( state, productId ) =>
	getProductNames( state ).includes( productId );

const productSelectors = {
	getProducts,
	getProductNames,
	getProduct,
	isValidProduct,
	isFetching: ( state, productId ) => state.products?.isFetching?.[ productId ] || false,
};

const purchasesSelectors = {
	getPurchases: state => state.purchases?.items || [],
	isRequestingPurchases: state => state.isRequestingPurchases || false,
};

const selectors = {
	...productSelectors,
	...purchasesSelectors,
};

export default selectors;
