import apiFetch from '@wordpress/api-fetch';
import { REST_API_SITE_DISMISS_BANNER } from './constants';

/*
 * Action constants
 */
const SET_AVAILABLE_LICENSES_IS_FETCHING = 'SET_AVAILABLE_LICENSES_IS_FETCHING';
const FETCH_AVAILABLE_LICENSES = 'FETCH_AVAILABLE_LICENSES';
const SET_AVAILABLE_LICENSES = 'SET_AVAILABLE_LICENSES';
const SET_IS_FETCHING_PRODUCT = 'SET_IS_FETCHING_PRODUCT';
const SET_PRODUCT = 'SET_PRODUCT';
const SET_PRODUCT_REQUEST_ERROR = 'SET_PRODUCT_REQUEST_ERROR';
const SET_PRODUCT_STATUS = 'SET_PRODUCT_STATUS';
const SET_STATS_COUNTS_IS_FETCHING = 'SET_STATS_COUNTS_IS_FETCHING';
const SET_STATS_COUNTS = 'SET_STATS_COUNTS';
const SET_DISMISSED_WELCOME_BANNER_IS_FETCHING = 'SET_DISMISSED_WELCOME_BANNER_IS_FETCHING';
const SET_DISMISSED_WELCOME_BANNER = 'SET_DISMISSED_WELCOME_BANNER';

const SET_GLOBAL_NOTICE = 'SET_GLOBAL_NOTICE';
const CLEAN_GLOBAL_NOTICE = 'CLEAN_GLOBAL_NOTICE';

const SET_PRODUCT_STATS = 'SET_PRODUCT_STATS';
const SET_IS_FETCHING_PRODUCT_STATS = 'SET_IS_FETCHING_PRODUCT_STATS';

const setStatsCountsIsFetching = isFetching => {
	return { type: SET_STATS_COUNTS_IS_FETCHING, isFetching };
};

const setAvailableLicensesIsFetching = isFetching => {
	return { type: SET_AVAILABLE_LICENSES_IS_FETCHING, isFetching };
};

const fetchAvailableLicenses = () => {
	return { type: FETCH_AVAILABLE_LICENSES };
};

const setAvailableLicenses = availableLicenses => {
	return { type: SET_AVAILABLE_LICENSES, availableLicenses };
};

const setProduct = product => ( { type: SET_PRODUCT, product } );

const setStatsCounts = statsCounts => ( { type: SET_STATS_COUNTS, statsCounts } );

const setRequestProductError = ( productId, error ) => ( {
	type: SET_PRODUCT_REQUEST_ERROR,
	productId,
	error,
} );

const setProductStatus = ( productId, status ) => {
	return { type: SET_PRODUCT_STATUS, productId, status };
};

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
 * Action that set the `isFetching` state of the product,
 * when the client hits the server.
 *
 * @param {string} productId   - My Jetpack product ID.
 * @param {boolean} isFetching - True if the product is being fetched. Otherwise, False.
 * @returns {object}           - Redux action.
 */
function setIsFetchingProduct( productId, isFetching ) {
	return {
		type: SET_IS_FETCHING_PRODUCT,
		productId,
		isFetching,
	};
}

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

const setProductStats = ( productId, stats ) => {
	return { type: SET_PRODUCT_STATS, productId, stats };
};

const setIsFetchingProductStats = ( productId, isFetching ) => {
	return { type: SET_IS_FETCHING_PRODUCT_STATS, productId, isFetching };
};

const productActions = {
	setProduct,
	setIsFetchingProduct,
	setRequestProductError,
	setProductStatus,
};

const noticeActions = {
	setGlobalNotice,
	cleanGlobalNotice,
};

const actions = {
	setAvailableLicensesIsFetching,
	fetchAvailableLicenses,
	setAvailableLicenses,
	setProductStats,
	setIsFetchingProductStats,
	setStatsCounts,
	setStatsCountsIsFetching,
	dismissWelcomeBanner,
	...noticeActions,
	...productActions,
};

export {
	SET_AVAILABLE_LICENSES_IS_FETCHING,
	FETCH_AVAILABLE_LICENSES,
	SET_AVAILABLE_LICENSES,
	SET_PRODUCT,
	SET_PRODUCT_REQUEST_ERROR,
	SET_IS_FETCHING_PRODUCT,
	SET_PRODUCT_STATUS,
	SET_GLOBAL_NOTICE,
	CLEAN_GLOBAL_NOTICE,
	SET_PRODUCT_STATS,
	SET_IS_FETCHING_PRODUCT_STATS,
	SET_STATS_COUNTS_IS_FETCHING,
	SET_STATS_COUNTS,
	SET_DISMISSED_WELCOME_BANNER_IS_FETCHING,
	SET_DISMISSED_WELCOME_BANNER,
	actions as default,
};
