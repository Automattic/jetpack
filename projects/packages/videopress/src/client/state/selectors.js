export const getVideos = state => {
	return state?.videos?.items || [];
};

export const getUploadingVideos = state => {
	const items = state?.videos?._meta?.items || {};
	return Object.keys( items || {} )
		.map( id => ( { ...items[ id ], id } ) )
		.filter( item => item.uploading );
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
	const _metaItems = state?.videos?._meta?.items || {};
	const _metaVideo = _metaItems[ id ] || {};
	return _metaVideo;
};

const selectors = {
	getVideos,
	getUploadingVideos,
	getVideosQuery,
	getPagination,
	getUploadedVideoCount,
	getIsFetching,
	getIsFetchingUploadedVideoCount,
	getStorageUsed,

	getVideo,
	getVideoStateMetadata,
};

export default selectors;
