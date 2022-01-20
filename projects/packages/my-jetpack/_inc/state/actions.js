const SET_PURCHASES_IS_FETCHING = 'SET_PURCHASES_IS_FETCHING';
const FETCH_PURCHASES = 'FETCH_PURCHASES';
const SET_PURCHASES = 'SET_PURCHASES';
const SET_PRODUCT_ACTION_ERROR = 'SET_PRODUCT_ACTION_ERROR';
const ACTIVATE_PRODUCT = 'ACTIVATE_PRODUCT';
const SET_PRODUCT_ACTIVATED = 'SET_PRODUCT_ACTIVATED';

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

export const setProductActivated = productId => {
	return { type: SET_PRODUCT_ACTIVATED, productId };
};

export const setProductActionError = error => {
	return { type: SET_PRODUCT_ACTION_ERROR, error };
};

const productActions = {
	activateProduct,
	setProductActivated,
	setProductActionError,
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
	SET_PRODUCT_ACTION_ERROR,
	ACTIVATE_PRODUCT,
	SET_PRODUCT_ACTIVATED,
	actions as default,
};
