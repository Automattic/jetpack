const getStatsCounts = state => {
	return state.statsCounts?.data;
};

const isFetchingStatsCounts = state => {
	return state.statsCounts?.isFetching || false;
};

const statsCountsSelectors = {
	getStatsCounts,
	isFetchingStatsCounts,
};

const selectors = {
	...statsCountsSelectors,
};

export default selectors;
