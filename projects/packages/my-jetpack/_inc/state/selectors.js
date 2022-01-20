export const getProducts = state => state.products?.items || {};
export const getProductNames = state => Object.keys( getProducts( state ) );
export const isValidProduct = ( state, product ) => getProductNames( state ).includes( product );

const productSelectors = {
	getProducts,
	getProductNames,
	isValidProduct,
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
