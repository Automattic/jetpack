const SET_PURCHASES_IS_FETCHING = 'SET_PURCHASES_IS_FETCHING';
const FETCH_PURCHASES = 'FETCH_PURCHASES';
const SET_PURCHASES = 'SET_PURCHASES';
const ACTIVATE_PRODUCT = 'ACTIVATE_PRODUCT';

const setPurchasesIsFetching = isFetching => {
	return { type: SET_PURCHASES_IS_FETCHING, isFetching };
};

const fetchPurchases = () => {
	return { type: FETCH_PURCHASES };
};

const setPurchases = purchases => {
	return { type: SET_PURCHASES, purchases };
};

const activateProduct = productId => {
	return { type: ACTIVATE_PRODUCT, productId };
};

const productActions = {
	activateProduct,
};

const actions = {
	setPurchasesIsFetching,
	fetchPurchases,
	setPurchases,
	...productActions,
};

export {
	SET_PURCHASES_IS_FETCHING,
	FETCH_PURCHASES,
	SET_PURCHASES,
	ACTIVATE_PRODUCT,
	actions as default,
};
