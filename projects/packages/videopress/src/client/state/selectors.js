export const getVideos = state => {
	return state?.videos?.items || [];
};

export const getVideosQuery = state => {
	return state?.videos?.query;
};

export const getPagination = state => {
	return state?.videos?.pagination;
};

export const getVideo = ( state, id ) => {
	const videos = getVideos( state );
	const video = videos.find( ( { id: videoId } ) => videoId === id );
	return video;
};

const selectors = {
	getVideos,
	getVideosQuery,
	getPagination,
	getVideo,
};

export default selectors;
