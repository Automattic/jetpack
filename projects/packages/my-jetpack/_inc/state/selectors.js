const productSelectors = {
	getProducts: state => state.products || {},
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
