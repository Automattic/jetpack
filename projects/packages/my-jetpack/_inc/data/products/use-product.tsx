import type { MyJetpackInitialState } from '../types';

const useProduct = productId => {
	const initialState = window?.myJetpackInitialState as MyJetpackInitialState;
	const product = initialState?.products?.items?.[ productId ];

	return {
		product,
	};
};

export default useProduct;
