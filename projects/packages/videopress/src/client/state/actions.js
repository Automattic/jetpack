import {
	SET_IS_FETCHING_VIDEOS,
	SET_VIDEOS,
	SET_VIDEOS_FETCH_ERROR,
	SET_VIDEOS_QUERY,
	SET_VIDEOS_PAGINATION,
	SET_VIDEO,
	SET_IS_FETCHING_UPLOADED_VIDEO_COUNT,
	SET_UPLOADED_VIDEO_COUNT,
} from './constants';

const setIsFetchingVideos = isFetching => {
	return { type: SET_IS_FETCHING_VIDEOS, isFetching };
};

const setFetchVideosError = error => ( {
	type: SET_VIDEOS_FETCH_ERROR,
	error,
} );

const setVideosQuery = query => {
	return { type: SET_VIDEOS_QUERY, query };
};

const setVideosPagination = pagination => {
	return { type: SET_VIDEOS_PAGINATION, pagination };
};

const setVideos = videos => {
	return { type: SET_VIDEOS, videos };
};

const setVideo = video => {
	return { type: SET_VIDEO, video };
};

const setIsFetchingUploadedVideoCount = isFetchingUploadedVideoCount => {
	return { type: SET_IS_FETCHING_UPLOADED_VIDEO_COUNT, isFetchingUploadedVideoCount };
};

const setUploadedVideoCount = uploadedVideoCount => {
	return { type: SET_UPLOADED_VIDEO_COUNT, uploadedVideoCount };
};

const actions = {
	setIsFetchingVideos,
	setFetchVideosError,
	setVideosQuery,
	setVideosPagination,
	setVideos,
	setVideo,
	setIsFetchingUploadedVideoCount,
	setUploadedVideoCount,
};

export { actions as default };
