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

const getWelcomeBannerHasBeenDismissed = state => {
	return state.welcomeBanner?.hasBeenDismissed;
};

const selectors = {
	...statsCountsSelectors,
	getWelcomeBannerHasBeenDismissed,
};

export default selectors;
