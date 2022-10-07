export const getVideos = state => {
	return state?.videos?.items || [];
};

export const getVideosQuery = state => {
	return state?.videos?.query;
};

export const getPagination = state => {
	return state?.videos?.pagination;
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

export const getStorageUsed = state => {
	return {
		storageUsed: state?.videos?.storageUsed,
	};
};

// Single Video stuff
export const getVideo = ( state, id ) => {
	const videos = getVideos( state );
	const video = videos.find( ( { id: videoId } ) => videoId === id );
	return video;
};

export const getVideoStateMetadata = ( state, id ) => {
	if ( ! state?.videos?._meta?.items ) {
		return {};
	}
	return state.videos._meta.items?.[ id ] || {};
};

export const isFetchingPurchases = state => {
	return state?.purchases?.isFetching;
};

export const getPurchases = state => {
	return state?.purchases?.items || [];
};

const selectors = {
	getVideos,
	getVideosQuery,
	getPagination,
	getUploadedVideoCount,
	getIsFetching,
	getIsFetchingUploadedVideoCount,
	getStorageUsed,

	getVideo,
	getVideoStateMetadata,

	getPurchases,
	isFetchingPurchases,
};

export default selectors;
