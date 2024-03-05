import apiFetch from '@wordpress/api-fetch';
import { REST_API_SITE_DISMISS_BANNER } from './constants';

/*
 * Action constants
 */
const SET_STATS_COUNTS_IS_FETCHING = 'SET_STATS_COUNTS_IS_FETCHING';
const SET_STATS_COUNTS = 'SET_STATS_COUNTS';
const SET_DISMISSED_WELCOME_BANNER_IS_FETCHING = 'SET_DISMISSED_WELCOME_BANNER_IS_FETCHING';
const SET_DISMISSED_WELCOME_BANNER = 'SET_DISMISSED_WELCOME_BANNER';

const SET_GLOBAL_NOTICE = 'SET_GLOBAL_NOTICE';
const CLEAN_GLOBAL_NOTICE = 'CLEAN_GLOBAL_NOTICE';

const setStatsCountsIsFetching = isFetching => {
	return { type: SET_STATS_COUNTS_IS_FETCHING, isFetching };
};

const setStatsCounts = statsCounts => ( { type: SET_STATS_COUNTS, statsCounts } );

const setDismissedWelcomeBannerIsFetching = isFetching => {
	return { type: SET_DISMISSED_WELCOME_BANNER_IS_FETCHING, isFetching };
};

const setDismissedWelcomeBanner = hasBeenDismissed => {
	return { type: SET_DISMISSED_WELCOME_BANNER, hasBeenDismissed };
};

const setGlobalNotice = ( message, options ) => ( {
	type: 'SET_GLOBAL_NOTICE',
	message,
	options,
} );

const cleanGlobalNotice = () => ( { type: 'CLEAN_GLOBAL_NOTICE' } );

/**
 * Request to set the welcome banner as dismissed
 *
 * @returns {Promise} - Promise which resolves when the banner is dismissed.
 */
const dismissWelcomeBanner = () => async store => {
	const { dispatch } = store;

	dispatch( setDismissedWelcomeBannerIsFetching( true ) );

	return apiFetch( {
		path: REST_API_SITE_DISMISS_BANNER,
		method: 'POST',
	} )
		.then( () => {
			dispatch( setDismissedWelcomeBanner( true ) );
		} )
		.finally( () => {
			dispatch( setDismissedWelcomeBannerIsFetching( false ) );
		} );
};

const noticeActions = {
	setGlobalNotice,
	cleanGlobalNotice,
};

const actions = {
	setStatsCounts,
	setStatsCountsIsFetching,
	dismissWelcomeBanner,
	...noticeActions,
};

export {
	SET_GLOBAL_NOTICE,
	CLEAN_GLOBAL_NOTICE,
	SET_STATS_COUNTS_IS_FETCHING,
	SET_STATS_COUNTS,
	SET_DISMISSED_WELCOME_BANNER_IS_FETCHING,
	SET_DISMISSED_WELCOME_BANNER,
	actions as default,
};
