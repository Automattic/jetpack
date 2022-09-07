export const getVideos = state => {
	return state?.videos?.items || [];
};

const productSelectors = {
	getVideos,
};

const selectors = {
	...productSelectors,
};

export default selectors;
