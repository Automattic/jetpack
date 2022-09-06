import { SET_IS_FETCHING_VIDEOS, SET_VIDEOS, SET_VIDEOS_FETCH_ERROR } from './constants';

const setIsFetchingVideos = query => {
	return { type: SET_IS_FETCHING_VIDEOS, query };
};

const setFetchVideosError = error => ( {
	type: SET_VIDEOS_FETCH_ERROR,
	error,
} );

const setVideos = ( videos, query ) => {
	return { type: SET_VIDEOS, videos, query };
};

const actions = {
	setIsFetchingVideos,
	setFetchVideosError,
	setVideos,
};

export { actions as default };
