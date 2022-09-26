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

export const getUploadedVideoCount = state => {
	return state?.videos?.uploadedVideoCount;
};

export const getIsFetching = state => {
	return state?.videos?.isFetching;
};

export const getIsFetchingUploadedVideoCount = state => {
	return state?.videos?.isFetchingUploadedVideoCount;
};

const selectors = {
	getVideos,
	getVideosQuery,
	getPagination,
	getVideo,
	getUploadedVideoCount,
	getIsFetching,
	getIsFetchingUploadedVideoCount,
};

export default selectors;
