const useAllProducts: () => Window[ 'myJetpackInitialState' ][ 'products' ][ 'items' ] = () => {
	const initialState = window?.myJetpackInitialState;
	const products = initialState?.products?.items || {};

	return products;
};

export default useAllProducts;
