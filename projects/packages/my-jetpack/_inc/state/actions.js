/*
 * Action constants
 */
const SET_STATS_COUNTS_IS_FETCHING = 'SET_STATS_COUNTS_IS_FETCHING';
const SET_STATS_COUNTS = 'SET_STATS_COUNTS';

const setStatsCountsIsFetching = isFetching => {
	return { type: SET_STATS_COUNTS_IS_FETCHING, isFetching };
};

const setStatsCounts = statsCounts => ( { type: SET_STATS_COUNTS, statsCounts } );

const actions = {
	setStatsCounts,
	setStatsCountsIsFetching,
};

export { SET_STATS_COUNTS_IS_FETCHING, SET_STATS_COUNTS, actions as default };
