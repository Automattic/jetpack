import { SET_IS_FETCHING_VIDEOS, SET_VIDEOS, SET_VIDEOS_FETCH_ERROR } from './constants';

const setIsFetchingVideos = isFetching => {
	return { type: SET_IS_FETCHING_VIDEOS, isFetching };
};

const setFetchVideosError = error => ( {
	type: SET_VIDEOS_FETCH_ERROR,
	error,
} );

const setVideos = videos => {
	return { type: SET_VIDEOS, videos };
};

const actions = {
	setIsFetchingVideos,
	setFetchVideosError,
	setVideos,
};

export { actions as default };
