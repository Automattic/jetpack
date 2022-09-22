import {
	SET_IS_FETCHING_VIDEOS,
	SET_VIDEOS,
	SET_VIDEOS_FETCH_ERROR,
	SET_VIDEOS_QUERY,
	SET_VIDEOS_PAGINATION,
	SET_VIDEO,
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

const actions = {
	setIsFetchingVideos,
	setFetchVideosError,
	setVideosQuery,
	setVideosPagination,
	setVideos,
	setVideo,
};

export { actions as default };
