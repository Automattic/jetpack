import {
	SET_IS_FETCHING_VIDEOS,
	SET_VIDEOS,
	SET_VIDEOS_FETCH_ERROR,
	SET_VIDEOS_QUERY,
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

const setVideos = videos => {
	return { type: SET_VIDEOS, videos };
};

const actions = {
	setIsFetchingVideos,
	setFetchVideosError,
	setVideosQuery,
	setVideos,
};

export { actions as default };
