const productSelectors = {
	getProducts: state => state.products || {},
};

const purchasesSelectors = {
	getPurchases: state => state.purchases || [],
};

const selectors = {
	...productSelectors,
	...purchasesSelectors,
};

export default selectors;
