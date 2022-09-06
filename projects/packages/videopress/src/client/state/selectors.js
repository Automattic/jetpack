export const getVideos = state => state?.videos?.items || [];

const productSelectors = {
	getVideos,
};

const selectors = {
	...productSelectors,
};

export default selectors;
