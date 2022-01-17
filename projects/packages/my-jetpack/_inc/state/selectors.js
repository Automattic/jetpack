const productSelectors = {
	getProducts: state => state.products || {},
};

const selectors = {
	...productSelectors,
};

export default selectors;
