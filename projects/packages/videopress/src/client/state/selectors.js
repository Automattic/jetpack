export const getVideos = state => {
	return state?.videos?.items || [];
};

export const getUploadingVideos = state => {
	const items = state?.videos?._meta?.items || {};
	return Object.keys( items || {} )
		.map( id => ( { ...items[ id ], id } ) )
		.filter( item => item.uploading );
};

export const getUploadErrorVideos = state => {
	const items = state?.videos?._meta?.items || {};
	return Object.keys( items || {} )
		.map( id => ( { ...items[ id ], id } ) )
		.filter( item => !! item.error );
};

export const getVideosQuery = state => {
	return state?.videos?.query;
};

export const getPagination = state => {
	return state?.videos?.pagination;
};

export const getVideosFilter = state => {
	return state?.videos?.filter;
};

export const getUploadedVideoCount = state => {
	return state?.videos?.uploadedVideoCount;
};

export const getUploadedLocalVideoCount = state => {
	return state?.localVideos?.uploadedVideoCount;
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

export const getFirstUploadedVideoId = state => {
	return state?.videos?.firstUploadedVideoId;
};

export const getFirstVideoProcessed = state => {
	return state?.videos?.firstVideoProcessed;
};

export const getDismissedFirstVideoPopover = state => {
	return state?.videos?.dismissedFirstVideoPopover;
};

export const getProcessedAllVideosBeingRemoved = state => {
	return state?.videos?._meta?.processedAllVideosBeingRemoved;
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

export const isFetchingFeatures = state => {
	return state?.features?.isFetching;
};

export const getFeatures = state => {
	const features = state?.features;

	// Return undefined when features haven't been loaded yet,
	// so usePlan can fall back to static paidFeatures from initial state.
	if ( features?.isVideoPressSupported === undefined ) {
		return undefined;
	}

	return {
		isVideoPressSupported: features.isVideoPressSupported ?? false,
		isVideoPress1TBSupported: features.isVideoPress1TBSupported ?? false,
		isVideoPressUnlimitedSupported: features.isVideoPressUnlimitedSupported ?? false,
	};
};

export const getLocalVideos = state => {
	return state?.localVideos?.items || [];
};

export const getIsFetchingLocalVideos = state => {
	return state?.localVideos?.isFetching;
};

export const getLocalVideosQuery = state => {
	return state?.localVideos?.query;
};

export const getLocalPagination = state => {
	return state?.localVideos?.pagination;
};

export const getUsers = state => {
	return state?.users?.items || [];
};

export const getUsersPagination = state => {
	return state?.users?.pagination;
};

export const getPlaybackToken = ( state, guid ) => {
	const tokens = state?.playbackTokens?.items || [];
	const tokenData = tokens.find( t => t?.guid === guid );
	return tokenData || {};
};

export const isFetchingPlaybackToken = state => {
	return state?.playbackTokens?.isFetching;
};

export const getVideoPressSettings = state => {
	return state?.siteSettings;
};

const selectors = {
	// VideoPress videos
	getVideos,
	getUploadingVideos,
	getVideosQuery,
	getPagination,
	getVideosFilter,
	getUploadedVideoCount,
	getIsFetching,
	getIsFetchingUploadedVideoCount,
	getStorageUsed,
	getFirstUploadedVideoId,
	getFirstVideoProcessed,
	getDismissedFirstVideoPopover,
	getProcessedAllVideosBeingRemoved,

	// Local videos
	getLocalVideos,
	getIsFetchingLocalVideos,
	getLocalVideosQuery,
	getLocalPagination,
	getUploadedLocalVideoCount,

	getVideo,
	getVideoStateMetadata,

	getUsers,
	getUsersPagination,

	getFeatures,
	isFetchingFeatures,

	getPlaybackToken,
	isFetchingPlaybackToken,

	getVideoPressSettings,
	getUploadErrorVideos,
};

export default selectors;
