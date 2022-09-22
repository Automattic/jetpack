export const getVideos = state => {
	return state?.videos?.items || [];
};

export const getVideosQuery = state => {
	return state?.videos?.query;
};

export const getVideo = ( state, id ) => {
	const videos = getVideos( state );
	const video = videos.find( ( { id: videoId } ) => videoId === id );
	return video;
};

const selectors = {
	getVideos,
	getVideosQuery,
	getVideo,
};

export default selectors;
