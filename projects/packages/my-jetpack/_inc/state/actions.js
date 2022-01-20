const SET_PURCHASES_IS_FETCHING = 'SET_PURCHASES_IS_FETCHING';
const FETCH_PURCHASES = 'FETCH_PURCHASES';
const SET_PURCHASES = 'SET_PURCHASES';

const setPurchasesIsFetching = isFetching => {
	return { type: SET_PURCHASES_IS_FETCHING, isFetching };
};

const fetchPurchases = () => {
	return { type: FETCH_PURCHASES };
};

const setPurchases = purchases => {
	return { type: SET_PURCHASES, purchases };
};

const actions = {
	setPurchasesIsFetching, // Purchases -> is fetching
	fetchPurchases, // Purchases -> fecth
	setPurchases, // Purchases -> set
};

export { SET_PURCHASES_IS_FETCHING, FETCH_PURCHASES, SET_PURCHASES, actions as default };
