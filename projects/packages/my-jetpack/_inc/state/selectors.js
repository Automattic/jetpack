const getStatsCounts = state => {
	return state.statsCounts?.data;
};

const noticeSelectors = {
	getGlobalNotice: state => state.notices?.global,
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
	...noticeSelectors,
	getWelcomeBannerHasBeenDismissed,
};

export default selectors;
