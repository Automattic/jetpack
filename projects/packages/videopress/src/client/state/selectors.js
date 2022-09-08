export const getVideos = state => {
	return state?.videos?.items || [];
};

export const getVideosQuery = state => {
	return state?.videos?.query;
};

const selectors = {
	getVideos,
	getVideosQuery,
};

export default selectors;
